import {
  toLocalParts,
  pickCount,
  generateCommitTimes,
  formatInstant,
  formatReadable,
} from './schedule.js';
import type { Config } from './config.js';

export interface GitLike {
  add(paths: string[]): Promise<unknown>;
  commit(
    message: string,
    options: Record<string, string>,
    env?: Record<string, string>,
  ): Promise<unknown>;
  push(): Promise<unknown>;
}

export interface Writer {
  writeFile(path: string, data: string): Promise<void>;
}

export interface RunResult {
  count: number;
  times: Date[];
}

export async function runOnce(
  cfg: Config,
  git: GitLike,
  writer: Writer,
  now: Date,
): Promise<RunResult> {
  const local = toLocalParts(now, cfg.timeZone);
  const count = pickCount(local, cfg.holidays, cfg);
  const times = generateCommitTimes(local, count, cfg, now);

  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    const instant = formatInstant(time, cfg.timeZone);
    const data = JSON.stringify({ date: instant }, null, 2);
    await writer.writeFile(cfg.dataPath, data);
    await git.add([cfg.dataPath]);
    await git.commit(
      `Auto commit #${i + 1} on ${formatReadable(time, cfg.timeZone)}`,
      { '--date': instant },
      { GIT_COMMITTER_DATE: instant },
    );
  }

  await git.push();
  return { count, times };
}

