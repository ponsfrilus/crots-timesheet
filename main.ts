import settings from './settings.json' with { type: 'json' };
import deno from './deno.json' with { type: 'json' };

// import {Path, WINDOWS_SEPS} from "https://deno.land/x/path/mod.ts";
//
// const nixPath = new Path("~/.crots/somethign");
// console.log(nixPath.elements);
// console.log(nixPath.toString());
// console.log(nixPath.ext);
// console.log(nixPath.exists);
import { ensureDir } from 'https://deno.land/std@0.224.0/fs/ensure_dir.ts';
// https://jsr.io/@std/cli/doc/parse-args/~/parseArgs
import { parseArgs } from '@std/cli/parse-args';
// import { Args } from "https://deno.land/x/args@2.0.7/flag-types.ts";
import { type Args } from 'https://deno.land/std@0.200.0/flags/mod.ts';
import { readLines } from '@std/io/read-lines';

import { Duration, Interval } from 'npm:luxon'; // DateTime

const settingsDirectory = `${Deno.env.get('HOME')}/.crots/`;
const settingsFilePath = `${settingsDirectory}settings.json`;

type settings = {
  'input_file': string;
  'week_hours': number;
};
const defaultsSettings = {
  'input_file': './tests/test.db',
  'week_hours': 42,
};

function printHelp(): void {
  console.log(`crots — CROnos Time Sheet ⌛`);
  console.log(`\n Usage: crots [OPTIONS...]`);
  console.log('\n Optional flags:');
  console.log('   -h, --help                Display this help and exit');
  // console.log("  -s, --save                Save settings for future greetings");
  // console.log("  -n, --name                Set your name for the greeting");
  // console.log("  -c, --color               Set the color of the greeting");
}

export function parseArguments(args: string[]): Args {
  console.debug('parseArguments');
  // All boolean arguments
  const booleanArgs = [
    'help',
    'debug',
    'verbose',
    'version',
  ];

  // All string arguments
  // const stringArgs = [];

  // And a list of aliases
  const alias = {
    'help': 'h',
    'debug': 'd',
    'verbose': 'v',
  };

  // Set the defaults
  // const defaults = default;

  return parseArgs(args, {
    alias,
    boolean: booleanArgs,
    // string: stringArgs,
    // default: defaults,
    // stopEarly: false,
    // "--": true,
  });
}

// https://docs.deno.com/runtime/tutorials/read_write_files
async function writeJson(path: string, data: object): Promise<string> {
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

async function initSettings() {
  // Check if the settingsFile exists
  try {
    await Deno.lstat(settingsFilePath);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
    // Create the settingsFilePath when needed
    try {
      console.log('Creating the default settings...');
      await ensureDir(settingsDirectory);
      await writeJson(settingsFilePath, defaultsSettings);
    } catch (err) {
      console.error(
        `Something went wrong, try to remove the settings directory (${settingsDirectory})`,
      );
      throw err;
    }
  }
}

// https://deno.land/x/30_seconds_of_typescript@v1.0.1/docs/isEmpty.md
const isEmpty = (val: any) => val == null || !(Object.keys(val) || val).length;

type weekData = {
  'week_hours': string | number;
  'day_hours_decimal': number;
  'day_milliseconds': number;
  'day_seconds': number;
  'day_minutes': number;
  'day_hours': number;
  'day_hours_human': number;
};
function weekData(settings: settings): weekData {
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

const parseLine = (line: string) => {
  // Note: "^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(?:(\d{2})|((\d{2}:\d{2})\s+(\d{2}:\d{2})))\s+(\d{2}:\d{2})\s+(\d+)?\s?(.*)"
  // This regex ↑ would match both
  // * 2022-10-01 10:00 11:00 12:00 16:00 60 description...
  // and
  // * 2022-10-01 10:00 60 16:00 60 description...
  //const regex = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(\d{2})\s+(\d{2}:\d{2})\s+(\d+)?\s?(.*)/
  const regex =
    /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s+(?:(\d{1,3})|((\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})))\s+(\d{1,2}:\d{2})(\s+(\d+)?\s?(.*))?$/;
  const found = line.trim().match(regex);

  type entry = {
    date: string;
    start_time: string;
    breaks?: number | null;
    end_time: string;
    extra?: number | null;
    description?: string;
    total: number | null;
    balance: number | null;
  };
  if (found) {
    console.debug('found', found);
    if (
      (found[1] && found[2] && found[3] && found[7]) ||
      (found[1] && found[2] && found[5] && found[6] && found[7])
    ) {
      const entry = {
        // date and time = found[0]
        'date': found[1],
        'start_time': found[2],
        'breaks': 0,
        'end_time': found[7],
        'extra': parseInt(found[9]) || 0,
        'description': found[10] || '-',
        'total': 0,
        'balance': 0,
      };
      if (found[1] && found[2] && found[3] && found[7]) {
        // 2022-10-01 10:00 60 16:00 60 description
        entry.breaks = parseInt(found[3]);
      }

      if (found[1] && found[2] && found[5] && found[6] && found[7]) {
        // 2022-10-01 10:00 11:00 12:00 16:00 60 description
        const break_start = Duration.fromISOTime(found[5]).toObject();
        const break_end = Duration.fromISOTime(found[6]).toObject();
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
      console.error('The following line is not matching the regex:', line);
    }
  } else if (line.trim() && !line.startsWith('#')) {
    console.error('The following line is malformed:', line);
  }
};

/**
 * Main logic of CLI.
 */
async function main(): Promise<void> {
  await initSettings();
  const conf = JSON.parse(
    Deno.readTextFileSync(`${Deno.env.get('HOME')}/.crots/settings.json`),
  );
  console.log(conf.input_file);

  const args = parseArguments(Deno.args);
  if (conf.input_file != args.input_file && !isEmpty(args.input_file)) {
    console.log('input_file is different that the settings');
  } else {
    args.input_file = conf.input_file;
  }
  if (conf.week_hours != args.week_hours && !isEmpty(args.week_hours)) {
    console.log('week_hours is different that the settings');
  } else {
    args.week_hours = conf.week_hours;
  }

  // If help flag enabled, print help.
  if (args.help) {
    printHelp();
    Deno.exit(0);
  }

  // If debug flag enabled, print help.
  if (args.debug) {
    // debug
    console.dir(Deno.args);
    console.dir(args);
  }

  // If version flag enabled, print it.
  if (args.version) {
    console.log(`You are running crots v${deno.version}.`);
    Deno.exit(0);
  }

  // Parsing the file
  const content = await Deno.open(conf.input_file);
  const data = [];
  for await (const l of readLines(content)) {
    const line = parseLine(l);
    console.log('Processing:', l);
    if (line) {
      data.push(line);
    }
  }

  console.log(data);
}

/**
 * Run CLI.
 */
await main();
