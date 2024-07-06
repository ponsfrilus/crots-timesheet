// https://docs.deno.com/runtime/tutorials/read_write_files
export async function writeJSON(path: string, data: object): Promise<string> {
  try {
    Deno.writeTextFileSync(path, JSON.stringify(data, null, 2));
    const writtenFile = await Deno.readTextFile(path);
    return JSON.parse(writtenFile);
  } catch (e) {
    return e.message;
  }
}
export async function writeSettings(path: string, data: object): Promise<string> {
  try {
    const settings = await writeJSON(path, data);
    console.log('Settings written to ' + path);
    return settings;
  } catch (e) {
    return e.message;
  }
}
// https://deno.land/x/30_seconds_of_typescript@v1.0.1/docs/isEmpty.md
// deno-lint-ignore no-explicit-any -- anything can be passed
export const isEmpty = (val: any) => val == null || !(Object.keys(val) || val).length;

// https://stackoverflow.com/a/175787/960623
// deno-lint-ignore no-explicit-any -- string or number can be passed
export const isNumeric = (num: any): boolean => !isNaN(num);

// https://stackoverflow.com/a/41716722/960623
// Note: fail for 1.005...
export const roundToTwo = (num: number): number => Math.round(num * 100 + Number.EPSILON) / 100;

// https://stackoverflow.com/a/38676273/960623
export function roundFloatNumber(num: number | string, dp = 2): number {
  const numToFixedDp = Number(num).toFixed(dp);
  return Number(numToFixedDp);
}
