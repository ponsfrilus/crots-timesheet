import { isNumeric, roundFloatNumber } from './tools.ts';

export function weekData(settings: Settings): weekData {
  // const wh = Duration.fromObject({ hours: settings.week_hours })
  const dh = Duration.fromObject({ hours: settings.week_hours / 5 });
  return {
    week_hours: settings.week_hours,
    day_hours_decimal: settings.week_hours / 5,
    day_milliseconds: parseFloat(parseFloat(dh.toMillis()).toFixed(2)),
    day_seconds: parseFloat(parseFloat(dh.as('seconds')).toFixed(2)),
    day_minutes: parseFloat(parseFloat(dh.as('minutes')).toFixed(2)),
    day_hours: dh.toFormat('hh:mm'),
    day_hours_human: dh.toHuman(),
  };
}

export const parseDescription = (desc: string) => {
  if (desc == null) return;
  const original_desc = desc;

  const regexEmojis =
    /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
  const regexTags = /^\[((?:[a-zA-Z0-9 ]+,)*[a-zA-Z0-9 ]+)\]/;

  desc = original_desc.trim();

  let tags;
  const tagsContent = regexTags.exec(desc);
  if (tagsContent) {
    tags = tagsContent[1].split(',').map((t) => t.trim());
  }
  // console.log(tags);

  let emojis;
  const emojisContent = desc.match(regexEmojis);
  if (emojisContent) {
    emojis = emojisContent[1].split(',').map((t) => t.trim());
  }
  // console.log(emojis);

  desc = desc.replace(regexEmojis, '');
  desc = desc.replace(regexTags, '');
  const descs = desc.split(',').map((t) => t.trim());
  // TODO: parse time (120)
  return { tags, emojis, descs };
};

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
        'description': found[10] ? found[10].trim() : '',
        'description_parsed': parseDescription(found[10]),
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
        if (isNumeric(Number(found[3]))) {
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
      return;
    }
  } else if (line == '') {
    if (debug) console.debug(`↳ \x1b[31m⨯\x1b[0m This line is empty`);
  } else if (line.startsWith('#') || line.startsWith('---')) {
    if (debug) console.debug(`↳ \x1b[31m⨯\x1b[0m This line is a comment`);
  } else {
    console.error('↳ \x1b[31m⨯\x1b[0m The following line is malformed:', original_line);
    return;
  }
};

export function summarize(crotsData: Array<entry>, _args: object) {
  const sums: month[][] = [];
  const sumsByWeek: week[][] = [];
  let yearTotal = 0;
  for (let i = 0; i < crotsData.length; i++) {
    const dt = DateTime.fromISO(crotsData[i].date);

    const year = dt.year;
    const month = dt.monthLong;
    const weekNumber = dt.weekNumber;

    sums[year] ??= [];
    // if (!sums[year].length) {
    //   console.log(`\n# ${year}`);
    // }
    sums[year][month] ??= { total_minutes: 0, total_hours: 0 };
    // if (sums[year][month].total_minutes === 0 && sums[year][month].total_hours === 0) {
    //   console.log(`\n## ${year}-${month}`);
    // }
    sumsByWeek[year] ??= [];
    sumsByWeek[year][weekNumber] ??= { total_minutes: 0, total_hours: 0 };
    // if (sumsByWeek[year][weekNumber].total_minutes === 0 && sumsByWeek[year][weekNumber].total_hours === 0) {
    //   console.log(`\n### Week #${weekNumber}`);
    // }

    yearTotal += crotsData[i].balance ?? 0;

    sums[year][month]['total_minutes'] += crotsData[i].balance;
    sums[year][month]['total_hours'] = sums[year][month]['total_minutes'] / 60;

    sumsByWeek[year][weekNumber]['total_minutes'] += crotsData[i].balance;
    sumsByWeek[year][weekNumber]['total_hours'] = sumsByWeek[year][weekNumber]['total_minutes'] / 60;

    const printableBalance = ((crotsData[i].balance ?? 0) < 0) ? crotsData[i].balance : '+' + crotsData[i].balance;

    const crotsTotal = crotsData[i].total ?? 0;
    const crotsTotalHours = crotsTotal / 60;
    const crotsTotalHoursRounded = roundFloatNumber(crotsTotalHours);

    console.log(
      `${crotsData[i].date} ${('' + crotsTotalHoursRounded).padStart(5, ' ')}h (${
        printableBalance?.toString().padStart(4, ' ')
      }m) ${crotsData[i].description}`,
    );
    // console.log(
    //   `${crotsData[i].date} ${parseFloat(crotsData[i].total / 60).toFixed(2).padStart(5, ' ')}h (${
    //     printableBalance.toString().padStart(4, ' ')
    //   }m) ${crotsData[i].description}`,
    // );
  }
  console.table(sums[2024]);
  console.table(sumsByWeek);
}