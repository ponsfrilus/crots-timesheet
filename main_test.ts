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
    c: false,
    config: false,
    d: true,
    debug: true,
    e: false,
    edit: false,
    h: true,
    help: true,
    html: false,
    report: false,
    reverse: false,
    s: false,
    save: false,
    summary: false,
    v: true,
    verbose: true,
    version: true,
    week_hours: 41,
    w: 41,
  });
});

Deno.test('default CLI arguments should be defined', () => {
  const args = parseArguments([
    '--week_hours',
    '42',
  ]);

  assertEquals(args, {
    _: [],
    c: false,
    config: false,
    d: false,
    debug: false,
    e: false,
    edit: false,
    h: false,
    help: false,
    html: false,
    report: false,
    reverse: false,
    s: false,
    save: false,
    summary: false,
    v: false,
    verbose: false,
    version: false,
    week_hours: 42,
    w: 42,
  });
});
