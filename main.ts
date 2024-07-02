import settings from './settings.json' with { type: 'json' };
import deno from './deno.json' with { type: 'json' };
// https://jsr.io/@std/cli/doc/parse-args/~/parseArgs
import { parseArgs } from '@std/cli/parse-args';
import { type Args } from 'https://deno.land/std@0.200.0/flags/mod.ts';
import { readLines } from '@std/io/read-lines';
import { isEmpty, parseLine } from './tools.ts';
import { initSettings } from './settings.ts';
const settingsDirectory = `${Deno.env.get('HOME')}/.crots/`;
const settingsFilePath = `${settingsDirectory}settings.json`;

type Settings = {
  'input_file': string;
  'week_hours': number;
};
const defaultsSettings: Settings = {
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
  // All boolean arguments
  const booleanArgs = [
    'config',
    'debug',
    'help',
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

/**
 * Main logic of CLI.
 */
async function main(): Promise<void> {
  await initSettings(settingsDirectory, settingsFilePath, defaultsSettings);

  const conf = JSON.parse(
    Deno.readTextFileSync(`${Deno.env.get('HOME')}/.crots/settings.json`),
  );
  //console.log(conf.input_file);

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

  // If debug flag enabled, print debug.
  if (args.debug) {
    // debug
    console.dir(Deno.args);
    //console.dir(args);
  }

  // If version flag enabled, print it.
  if (args.version) {
    console.log(`You are running crots v${deno.version}.`);
    Deno.exit(0);
  }

  // If version flag enabled, print it.
  if (args.config) {
    for (const key of ['debug', 'verbose', 'input_file', 'week_hours']) {
      console.log(`${key}: ${args[key]}`);
    }
    Deno.exit(0);
  }

  // Parsing the file
  const content = await Deno.open(conf.input_file);
  const data = [];
  for await (const l of readLines(content)) {
    const parsedLine = parseLine(l, settings, args.debug);
    //console.log('Processing:', l);
    if (parsedLine) {
      data.push(parsedLine);
      //console.log(parsedLine)
    }
  }

  console.log(data);
}

/**
 * Run CLI.
 */
await main();
