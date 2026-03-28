const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseTimeToMinutes(value) {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'any time') return null;

  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    const minute = Number(amPmMatch[2]);
    const period = amPmMatch[3].toUpperCase();

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

    if (period === 'AM' && hour === 12) hour = 0;
    if (period === 'PM' && hour !== 12) hour += 12;
    return hour * 60 + minute;
  }

  const twentyFourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourMatch) {
    const hour = Number(twentyFourMatch[1]);
    const minute = Number(twentyFourMatch[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
  }

  return null;
}

function formatMinutesTo12h(minutes) {
  const total = Number(minutes);
  if (Number.isNaN(total) || total < 0) return '';

  const hour24 = Math.floor(total / 60);
  const minute = total % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

function toDateTimeFromDateAndLabel(dateString, slotTime) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const minutes = parseTimeToMinutes(slotTime);
  if (minutes === null) return null;

  const out = new Date(date);
  out.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return out;
}

function buildSlotsFromAvailability(availability, dateString, stepMinutes = 30) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return [];

  const dayName = DAY_NAMES[date.getDay()];
  const windows = (availability || []).filter(
    (entry) => entry?.day === dayName || entry?.day === 'All Days'
  );

  const slots = [];
  for (const window of windows) {
    const start = parseTimeToMinutes(window.startTime);
    const end = parseTimeToMinutes(window.endTime);
    if (start === null || end === null || end <= start) continue;

    for (let m = start; m + stepMinutes <= end; m += stepMinutes) {
      slots.push(formatMinutesTo12h(m));
    }
  }

  return [...new Set(slots)];
}

module.exports = {
  DAY_NAMES,
  parseTimeToMinutes,
  formatMinutesTo12h,
  toDateTimeFromDateAndLabel,
  buildSlotsFromAvailability,
};
