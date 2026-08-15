import { readFileSync } from 'node:fs';
import type { ScheduleConfig } from './schedule.js';

export interface Config extends ScheduleConfig {
  gitUser: string;
  gitEmail: string;
  dataPath: string;
  holidaysPath: string;
  holidays: string[];
}

interface HolidayEntry {
  date: string;
  name: string;
  type: string;
}

const DEFAULTS = {
  weekdayMin: 5,
  weekdayMax: 10,
  weekendMin: 1,
  weekendMax: 3,
  startHour: 8,
  endHour: 17,
  timeZone: 'Asia/Jakarta',
  gitUser: '',
  gitEmail: '',
  dataPath: './data.json',
  holidaysPath: './holidays.json',
} as const;

function toInt(
  env: Record<string, string | undefined>,
  name: string,
  fallback: number,
): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) {
    throw new Error(`env ${name} bukan angka: "${raw}"`);
  }
  return value;
}

export function parseEnv(
  env: Record<string, string | undefined>,
): Config {
  const cfg: Config = {
    weekdayMin: toInt(env, 'WEEKDAY_MIN', DEFAULTS.weekdayMin),
    weekdayMax: toInt(env, 'WEEKDAY_MAX', DEFAULTS.weekdayMax),
    weekendMin: toInt(env, 'WEEKEND_MIN', DEFAULTS.weekendMin),
    weekendMax: toInt(env, 'WEEKEND_MAX', DEFAULTS.weekendMax),
    startHour: toInt(env, 'START_HOUR', DEFAULTS.startHour),
    endHour: toInt(env, 'END_HOUR', DEFAULTS.endHour),
    timeZone: env.TZ ?? DEFAULTS.timeZone,
    gitUser: env.GIT_USER ?? DEFAULTS.gitUser,
    gitEmail: env.GIT_EMAIL ?? DEFAULTS.gitEmail,
    dataPath: env.DATA_PATH ?? DEFAULTS.dataPath,
    holidaysPath: env.HOLIDAYS_PATH ?? DEFAULTS.holidaysPath,
    holidays: [],
  };

  if (cfg.weekdayMin > cfg.weekdayMax) {
    throw new Error('WEEKDAY_MIN tidak boleh lebih besar dari WEEKDAY_MAX');
  }
  if (cfg.weekendMin > cfg.weekendMax) {
    throw new Error('WEEKEND_MIN tidak boleh lebih besar dari WEEKEND_MAX');
  }
  if (cfg.startHour >= cfg.endHour) {
    throw new Error('START_HOUR harus lebih kecil dari END_HOUR');
  }
  if (cfg.startHour < 0 || cfg.endHour > 24) {
    throw new Error('START_HOUR/END_HOUR harus dalam rentang 0..24');
  }

  return cfg;
}

export function loadHolidays(year: number, path: string): string[] {
  let data: Record<string, HolidayEntry[]>;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return [];
  }
  return (data[year] ?? []).map((entry) => entry.date);
}
