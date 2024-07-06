import { ensureDir } from 'https://deno.land/std@0.224.0/fs/ensure_dir.ts';
import { writeSettings } from './tools.ts';

export async function initSettings(settingsDirectory: string, settingsFilePath: string, defaultsSettings: Settings) {
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
      await writeSettings(settingsFilePath, defaultsSettings);
      return true;
    } catch (err) {
      console.error(
        `Something went wrong, try to remove the settings directory (${settingsDirectory})`,
      );
      throw err;
    }
  }
}
