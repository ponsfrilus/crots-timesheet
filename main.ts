import settings from './settings.json' with { type: 'json' };
import deno from './deno.json' with { type: 'json' };
// https://jsr.io/@std/cli/doc/parse-args/~/parseArgs
import { parseArgs } from '@std/cli/parse-args';
import { type Args } from 'https://deno.land/std@0.200.0/flags/mod.ts';
import { readLines } from '@std/io/read-lines';
import { isEmpty, isNumeric, writeJson } from './tools.ts';
import { parseLine, summarize } from './crots.ts';
import { initSettings } from './settings.ts';
const settingsDirectory = `${Deno.env.get('HOME')}/.crots/`;
const settingsFilePath = `${settingsDirectory}settings.json`;
// import { Table } from 'easy-table'

type Settings = {
  'input_file': string;
  'week_hours': number;
};
const defaultsSettings: Settings = {
  'input_file': './tests/test.db',
  'week_hours': 42,
};

function printHelp(): void {
  console.log('');
  console.log('\x1b[1m%s\x1b[0m', ' crots', `— CROnos Time Sheet ⌛ — v${deno.version}`);
  console.log('');
  console.log(` Usage: crots [OPTIONS...]`);
  console.log('\n Optional flags:');
  console.log('  -h, --help           Display this help and exit');
  console.log('  -c, --config         Display the config and exit');
  console.log('  --version            Display the version and exit');
  console.log('  -d, --debug          Debug mode');
  console.log('  -v, --verbose        Verbose mode');
  console.log('');
  console.log('  -s, --save           Save settings for future use');
  console.log('  -wh, --week_hours    Set the week hours');
  console.log('  -i, --input_file     Set the input file');
  console.log('  \x1b[3m%s\x1b[0m', 'ⓘ  Exemple: crots -wh 42 --input_file ./db.crots --save');
  console.log('');
  console.log('  --date               Specify a year or a month');
  console.log('  \x1b[3m%s\x1b[0m', 'ⓘ  Exemple: crots --date=2024-06 --report');
  console.log('');
  console.log('  --report             Create a markdown report');
  console.log('  --summary            Create a hours summary');
  console.log('  --html               Save the report and the summary in a HTML file');
  console.log('  --reverse            Use a antichronological order');
  console.log('  \x1b[3m%s\x1b[0m', 'ⓘ  Exemple: crots --report --summary --html');
}

export function parseArguments(args: string[]): Args {
  // All boolean arguments
  const booleanArgs = [
    'config',
    'debug',
    'help',
    'html',
    'report',
    'reverse',
    'save',
    'summary',
    'verbose',
    'version',
  ];

  // All string arguments
  // const stringArgs = [];

  // And a list of aliases
  const alias = {
    'help': 'h',
    'config': 'c',
    'debug': 'd',
    'save': 's',
    'verbose': 'v',
    'week_hours': 'wh',
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

  const runSettings = JSON.parse(
    Deno.readTextFileSync(`${Deno.env.get('HOME')}/.crots/settings.json`),
  );

  const args = parseArguments(Deno.args);
  if (runSettings.input_file != args.input_file && !isEmpty(args.input_file)) {
    console.log('input_file is different than the settings');
    runSettings.input_file = args.input_file;
  }
  if (runSettings.week_hours != args.week_hours && isNumeric(args.week_hours)) {
    console.log('week_hours is different than the settings');
    runSettings.week_hours = args.week_hours;
  }
  if (args.save) {
    await writeJson(settingsFilePath, runSettings);
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

  // If version config enabled, print it.
  if (args.config) {
    for (const key of ['debug', 'verbose']) {
      console.log(`${key}: ${args[key]}`);
    }
    console.log('input_file:', runSettings.input_file);
    console.log('week_hours:', runSettings.week_hours);
    Deno.exit(0);
  }

  // Parsing the file
  const content = await Deno.open(runSettings.input_file);
  const data = [];
  for await (const l of readLines(content)) {
    const parsedLine = parseLine(l, settings, args.debug);
    if (parsedLine) {
      data.push(parsedLine);
    }
  }

  if (args.reverse) {
    data.sort((a, b) => (a.date > b.date) ? -1 : ((a.date < b.date) ? 1 : 0));
  } else {
    data.sort((a, b) => (a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
  }

  if (args.debug) {
    console.debug(data);
  }

  if (args.debug || args['save-json']) {
    await writeJson('tmp.crots', data);
  }

  if (args.report || args.summary) {
    console.log('report');
    summarize(data, { report: args.report, summary: args.summary });
  }
}

/**
 * Run CLI.
 */
await main();
