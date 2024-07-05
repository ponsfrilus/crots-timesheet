// https://docs.deno.com/runtime/tutorials/read_write_files
export async function writeJson(path: string, data: object): Promise<string> {
  try {
    Deno.writeTextFileSync(path, JSON.stringify(data, null, 2));
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

// https://stackoverflow.com/a/41716722/960623
// Note: fail for 1.005...
export const roundToTwo = (num: number): number => Math.round( num * 100 + Number.EPSILON ) / 100

// https://stackoverflow.com/a/38676273/960623
export function roundFloatNumber (num: number | string, dp=2): number {
  const numToFixedDp = Number(num).toFixed(dp);
  return Number(numToFixedDp);
}