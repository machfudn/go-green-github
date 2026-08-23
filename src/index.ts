import { writeFile } from 'node:fs/promises';
import { simpleGit } from 'simple-git';
import { parseEnv, loadHolidays, type Config } from './config.js';
import { toLocalParts } from './schedule.js';
import { runOnce, type GitLike, type Writer } from './commit.js';

const env = parseEnv(process.env);
const year = toLocalParts(new Date(), env.timeZone).year;
const cfg: Config = { ...env, holidays: loadHolidays(year, env.holidaysPath) };

const g = simpleGit();
const git: GitLike = {
  add: (paths) => g.add(paths),
  commit: (message, options, commitEnv) =>
    g.env(commitEnv ?? {}).commit(message, options),
  push: () => g.push(),
};
const writer: Writer = { writeFile };

try {
  const result = await runOnce(cfg, git, writer, new Date());
  console.log(`Selesai: ${result.count} commit hari ini, 1x push.`);
} catch (err) {
  console.error('Gagal menjalankan bot:', err);
  process.exit(1);
}
