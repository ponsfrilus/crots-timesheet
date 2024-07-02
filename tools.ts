// https://docs.deno.com/runtime/tutorials/read_write_files
export async function writeJson(path: string, data: object): Promise<string> {
  try {
    Deno.writeTextFileSync(path, JSON.stringify(data));
    const settings = await Deno.readTextFile(
      `${Deno.env.get('HOME')}/.crots/settings.json`,
    );
    console.log('... written to ' + path);
    return JSON.parse(settings);
  } catch (e) {
    return e.message;
  }
}

// https://deno.land/x/30_seconds_of_typescript@v1.0.1/docs/isEmpty.md
export const isEmpty = (val: any) => val == null || !(Object.keys(val) || val).length;

// https://stackoverflow.com/a/175787/960623
export const isNumeric = (num: any): boolean => !isNaN(num);

export function weekData(settings: Settings): weekData {
  // const wh = Duration.fromObject({ hours: settings.week_hours })
  const dh = Duration.fromObject({ hours: settings.week_hours / 5 });
  return {
    'week_hours': settings.week_hours,
    'day_hours_decimal': settings.week_hours / 5,
    'day_milliseconds': parseFloat(parseFloat(dh.toMillis()).toFixed(2)),
    'day_seconds': parseFloat(parseFloat(dh.as('seconds')).toFixed(2)),
    'day_minutes': parseFloat(parseFloat(dh.as('minutes')).toFixed(2)),
    'day_hours': dh.toFormat('hh:mm'),
    'day_hours_human': dh.toHuman(),
  };
}

import { DateTime, Duration, Interval } from 'npm:luxon'; // DateTime
export const parseLine = (line: string, settings: Settings, debug: boolean): entry | undefined => {
  const original_line = line;
  if (debug) console.debug(`\n‣ ${original_line}`);
  // Note: "^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(?:(\d{2})|((\d{2}:\d{2})\s+(\d{2}:\d{2})))\s+(\d{2}:\d{2})\s+(\d+)?\s?(.*)"
  // This regex ↑ would match both
  // * 2022-10-01 10:00 11:00 12:00 16:00 60 description...
  // and
  // * 2022-10-01 10:00 60 16:00 60 description...
  //const regex = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(\d{2})\s+(\d{2}:\d{2})\s+(\d+)?\s?(.*)/
  const regex =
    /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s+(?:(\d{1,3})|((\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})))\s+(\d{1,2}:\d{2})(\s+(\d+)?\s?(.*))?$/;
  line = line.trim();
  const found = line.match(regex);

  if (found) {
    if (debug) console.debug(`↳ \x1b[32m✓\x1b[0m regex pass`);
    if (
      (found[1] && found[2] && found[3] && found[7]) ||
      (found[1] && found[2] && found[5] && found[6] && found[7])
    ) {
      const entry = {
        // date and time = found[0]
        'date': '',
        'start_time': found[2],
        'breaks': 0,
        'end_time': found[7],
        'extra': parseInt(found[9]) || 0,
        'description': found[10] || '-',
        'total': 0,
        'balance': 0,
      };

      // Validate date
      if (DateTime.fromISO(found[1]).isValid) {
        entry.date = found[1];
      } else {
        console.error(
          `↳ \x1b[31m⨯\x1b[0m The date is invalid (${DateTime.fromISO(found[1]).invalidReason}):`,
          original_line,
        );
        return;
      }
      // Validate start_time
      if (DateTime.fromISO(found[2]).isValid) {
        entry.start_time = found[2];
      } else {
        console.error(
          `↳ \x1b[31m⨯\x1b[0m The start_time is invalid (${DateTime.fromISO(found[2]).invalidReason}):`,
          original_line,
        );
        return;
      }
      // Validate end_time
      if (DateTime.fromISO(found[7]).isValid) {
        entry.end_time = found[7];
      } else {
        console.error(
          `↳ \x1b[31m⨯\x1b[0m The end_time is invalid (${DateTime.fromISO(found[7]).invalidReason}):`,
          original_line,
        );
        return;
      }

      if (found[1] && found[2] && found[3] && found[7]) { // Note the regex allows only 1 to 3 digits here
        // 2022-10-01 10:00 60 16:00 60 description
        if (isNumeric(Number(found[3])))  {
          entry.breaks = Number(found[3]);
        } else {
          console.error(`↳ \x1b[31m⨯\x1b[0m The break is invalid (${found[3]}):`, original_line);
          return;
        }
      }

      if (found[1] && found[2] && found[5] && found[6] && found[7]) {
        // 2022-10-01 10:00 11:00 12:00 16:00 60 description
        // Validate break_start_time
        let break_start: number = 0;
        if (DateTime.fromISO(found[5]).isValid) {
          break_start = Duration.fromISOTime(found[5]).toObject();
        } else {
          console.error(
            `↳ \x1b[31m⨯\x1b[0m The break_start is invalid (${DateTime.fromISO(found[5]).invalidReason}):`,
            original_line,
          );
          return;
        }
        // Validate break_end_time
        let break_end: number = 0;
        if (DateTime.fromISO(found[6]).isValid) {
          break_end = Duration.fromISOTime(found[6]).toObject();
        } else {
          console.error(
            `↳ \x1b[31m⨯\x1b[0m The break_end is invalid (${DateTime.fromISO(found[6]).invalidReason}):`,
            original_line,
          );
          return;
        }
        const break_duration_minutes = Interval.fromDateTimes(
          break_start,
          break_end,
        ).length('minutes');

        entry.breaks = break_duration_minutes;
      }

      // Total of the day
      const total_without_breaks = Interval.fromDateTimes(
        Duration.fromISOTime(entry.start_time).toObject(),
        Duration.fromISOTime(entry.end_time).toObject(),
      ).length('minutes');
      entry.total = total_without_breaks - entry.breaks + entry.extra;

      // Balance of the day
      entry.balance = entry.total - weekData(settings).day_minutes;

      return entry;
    } else {
      console.error('↳ \x1b[31m⨯\x1b[0m An error occured with the following line:', original_line);
    }
  } else if (line == '') {
    if (debug) console.debug(`↳ \x1b[31m⨯\x1b[0m This line is empty`);
  } else if (line.startsWith('#')) {
    if (debug) console.debug(`↳ \x1b[31m⨯\x1b[0m This line is a comment`);
  } else {
    console.error('↳ \x1b[31m⨯\x1b[0m The following line is malformed:', original_line);
  }
};
