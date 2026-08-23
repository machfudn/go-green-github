export interface ScheduleConfig {
  weekdayMin: number;
  weekdayMax: number;
  weekendMin: number;
  weekendMax: number;
  startHour: number;
  endHour: number;
  timeZone: string;
}

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
  second: number;
}

const WEEKDAY_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const pad = (n: number): string => String(n).padStart(2, '0');

export function toLocalParts(date: Date, timeZone: string): LocalParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value);
  const weekdayName =
    parts.find((p) => p.type === 'weekday')?.value ?? 'Thu';

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    weekday: WEEKDAY_SHORT[weekdayName] ?? 4,
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

export function dateKey(parts: LocalParts): string {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function isWeekend(parts: LocalParts): boolean {
  return parts.weekday === 0 || parts.weekday === 6;
}

export function isHoliday(
  parts: LocalParts,
  holidays: readonly string[],
): boolean {
  return holidays.includes(dateKey(parts));
}

export function pickCount(
  parts: LocalParts,
  holidays: readonly string[],
  cfg: ScheduleConfig,
): number {
  const off = isWeekend(parts) || isHoliday(parts, holidays);
  const min = off ? cfg.weekendMin : cfg.weekdayMin;
  const max = off ? cfg.weekendMax : cfg.weekdayMax;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getOffsetMs(date: Date, timeZone: string): number {
  const parts = toLocalParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return Math.round((asUtc - date.getTime()) / 60_000) * 60_000;
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(guess - getOffsetMs(new Date(guess), timeZone));
}

export function generateCommitTimes(
  parts: LocalParts,
  count: number,
  cfg: ScheduleConfig,
  now?: Date,
): Date[] {
  if (count <= 0) return [];
  const { startHour, endHour, timeZone } = cfg;
  const slots = (endHour - startHour) * 3600;
  if (count > slots) {
    throw new Error(
      `count ${count} melebihi slot waktu yang tersedia (${slots} detik)`,
    );
  }

  const base = zonedTimeToUtc(
    parts.year,
    parts.month,
    parts.day,
    0,
    0,
    0,
    timeZone,
  );

  const first = startHour * 3600;
  let hi = first + slots - 1;
  if (now) {
    const np = toLocalParts(now, timeZone);
    const nowSec = Math.max(0, np.hour * 3600 + np.minute * 60 + np.second);
    hi = Math.min(hi, nowSec);
  }
  // Kalau now masih sebelum START_HOUR, geser window ke bawah supaya
  // ujungnya menyentuh now (lebar tetap); tidak ada timestamp masa depan.
  const lo = Math.max(0, Math.min(first, hi - slots + 1));
  const available = hi - lo + 1;
  const target = Math.min(count, available);

  const chosen = new Set<number>();
  let guard = 0;
  while (chosen.size < target && guard < 100_000) {
    chosen.add(lo + Math.floor(Math.random() * available));
    guard++;
  }

  return [...chosen]
    .sort((a, b) => a - b)
    .map((second) => new Date(base.getTime() + second * 1000));
}

export function formatInstant(date: Date, timeZone: string): string {
  const p = toLocalParts(date, timeZone);
  const offset = Math.round(getOffsetMs(date, timeZone) / 60_000);
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${dateKey(p)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}${sign}${pad(hours)}:${pad(minutes)}`;
}

export function formatReadable(date: Date, timeZone: string): string {
  const p = toLocalParts(date, timeZone);
  return `${dateKey(p)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}
