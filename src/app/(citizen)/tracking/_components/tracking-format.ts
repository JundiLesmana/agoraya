const WIB_TIME_ZONE = 'Asia/Jakarta';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function formatDateTimeWib(value: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: WIB_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
}

function getJakartaCalendarDay(value: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: WIB_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(value);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return Date.UTC(year, month - 1, day);
}

export function getDaysUntilDeadline(deadline: string | Date, now = new Date()): number {
  const deadlineDay = getJakartaCalendarDay(new Date(deadline));
  const currentDay = getJakartaCalendarDay(now);
  return Math.round((deadlineDay - currentDay) / MILLISECONDS_PER_DAY);
}
