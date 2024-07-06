import deno from './deno.json' with { type: 'json' };
import { open } from 'https://deno.land/x/open/index.ts';
// https://jsr.io/@std/cli/doc/parse-args/~/parseArgs
import { parseArgs } from '@std/cli/parse-args';
import { type Args } from 'https://deno.land/std@0.200.0/flags/mod.ts';
import { readLines } from '@std/io/read-lines';
import { isEmpty, writeJSON, writeSettings } from './tools.ts';
import { parseLine, summarize } from './crots.ts';
import { initSettings } from './settings.ts';
const settingsDirectory = `${Deno.env.get('HOME')}/.crots/`;
const settingsFilePath = `${settingsDirectory}settings.json`;
// import { Table } from 'easy-table'

const defaultsSettings: crotsSettings = {
  'file': '',
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
  console.log('  -w, --week_hours     Set the week hours');
  console.log('  -f, --file           Set the input file');
  console.log('  \x1b[3m%s\x1b[0m', 'ⓘ  Exemple: crots -w 42 --file ./db.crots --save');
  console.log('');
  console.log('  -e, --edit           Open the crots db');
  console.log('  -g, --github         Open the crots GitHub repository');
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
    'edit',
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
    'edit': 'e',
    'file': 'f',
    'github': 'g',
    'save': 's',
    'verbose': 'v',
    'week_hours': 'w',
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

  if (runSettings.file != args.file && !isEmpty(args.file)) {
    console.log('file is different than the settings');
    // Note: this does not work with ~/.crots/something
    const fileRealPath = await Deno.realPath(args.file);
    runSettings.file = fileRealPath;
  }

  if (runSettings.week_hours != args.week_hours && args.week_hours != undefined) {
    console.log('week_hours is different than the settings');
    runSettings.week_hours = args.week_hours;
  }
  if (args.save) {
    await writeSettings(settingsFilePath, runSettings);
  }

  // TODO: OR if there is no file to the runSettings.file PATH
  if (isEmpty(runSettings.file)) {
    const createCrotsFile: boolean = confirm('Crots file not found. Create a default file?');
    if (createCrotsFile) {
      const crotsFilePath: string = prompt('Crots file path:', `${Deno.env.get('HOME')}/.crots/my-timesheet.crots`) ??
        '';
      const fileContent: string = `#
# Default time sheet file for crots v${deno.version}
#
# An entry can be either
#   ${new Date().toISOString().split('T')[0]} 08:00 60 17:00 [WFH]ℹ️  A default entry with lunch break in minutes
# or
#   ${
        new Date().toISOString().split('T')[0]
      } 08:00 12:00 13:00 17:00 [Office]ℹ️  A default entry with end and start hours
# 
# Additional documentation is available on
#   https://github.com/ponsfrilus/crots-timesheet
#

${
        new Date().toISOString().split('T')[0]
      } 08:00 12:00 13:00 17:24 [example]ℹ️  A task for this day (1h), another task (2h)
`;
      try {
        await Deno.lstat(crotsFilePath);
        console.log(`\nCrots file ${crotsFilePath} already exists!\n`);
      } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
          throw err;
        }
        try {
          Deno.writeTextFileSync(crotsFilePath, fileContent);
        } catch (err) {
          console.error(err);
          throw err;
        }
      }
      const fileRealPath = await Deno.realPath(crotsFilePath);
      runSettings.file = fileRealPath;
      await writeSettings(settingsFilePath, runSettings);
    }
    console.log('Please run crots again.');
    Deno.exit(0);
  }
  // If version config enabled, print it.
  if (args.config) {
    for (const key of ['debug', 'verbose']) {
      console.log(`${key}: ${args[key]}`);
    }
    console.log('file:', runSettings.file);
    console.log('week_hours:', runSettings.week_hours);
    Deno.exit(0);
  }

  // If edit flag enabled, open the crots file for edition
  if (args.edit) {
    await open(runSettings.file);
    Deno.exit(0);
  }
  if (args.github) {
    // Opens the crots GitHub repository in the default browser.
    await open('https://github.com/ponsfrilus/crots-timesheet/');
    Deno.exit(0);
  }

  // Parsing the file
  const content = await Deno.open(runSettings.file);
  const data = [];
  for await (const l of readLines(content)) {
    const parsedLine = parseLine(l, runSettings, args.debug);
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
    await writeJSON('tmp.crots', data);
  }

  if (args.report || args.html || args.summary) {
    // console.log('report');
    summarize(data, {
      report: args.report,
      summary: args.summary,
      date: args.date,
      html: args.html,
      debug: args.debug,
    });
  }
}

/**
 * Run CLI.
 */
await main();
