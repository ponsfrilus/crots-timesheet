import { assertEquals } from 'https://deno.land/std@0.200.0/testing/asserts.ts';
import { parseArguments } from './main.ts';

Deno.test('parseArguments should correctly parse CLI arguments', () => {
  const args = parseArguments([
    '-h',
    '--week_hours',
    '41',
    '--version',
    '-d',
    '-v',
  ]);

  assertEquals(args, {
    _: [],
    d: true,
    debug: true,
    h: true,
    help: true,
    v: true,
    verbose: true,
    version: true,
    week_hours: 41,
  });
});

Deno.test('default CLI arguments should be defined', () => {
  const args = parseArguments([
    '--week_hours',
    '42',
  ]);

  assertEquals(args, {
    _: [],
    d: false,
    debug: false,
    h: false,
    help: false,
    // input_file: settings.input_file,
    v: false,
    verbose: false,
    week_hours: 42,
  });
});
