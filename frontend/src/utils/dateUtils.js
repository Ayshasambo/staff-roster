/**
 * Date utility helpers with Nigerian timezone & locale support
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Format a Date or date string to full Nigerian display date
 */
export function formatDisplayDate(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  try {
    return new Intl.DateTimeFormat('en-NG', {
      timeZone: 'Africa/Lagos',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toDateString();
  }
}

/**
 * Format date for HTML date inputs (YYYY-MM-DD)
 */
export function formatDateForInput(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate working days between two dates (Mon-Fri)
 */
export function calculateWorkingDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (start > end) return 0;

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day >= 1 && day <= 5) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/**
 * Generates formatted WhatsApp text message for a monthly roster
 */
export function generateWhatsAppRosterText(roster) {
  if (!roster || !roster.shifts || roster.shifts.length === 0) {
    return 'No shifts scheduled.';
  }

  const monthName = MONTH_NAMES[roster.month - 1];
  let text = `📋 *STAFF DUTY ROSTER - ${monthName.toUpperCase()} ${roster.year}*\n`;
  text += `Status: ${roster.status === 'published' ? '✅ Published / Final' : '📝 Draft'}\n`;
  text += `------------------------------------\n\n`;

  let currentWeek = '';

  roster.shifts.forEach((shift) => {
    const dateObj = new Date(shift.date);
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];
    const dateNum = dateObj.getDate();
    const staffNames = (shift.assignedStaff || [])
      .map((s) => (typeof s === 'object' ? s.name : 'Unassigned'))
      .join(' & ');

    text += `🔹 *${dayName.slice(0, 3)} ${dateNum} ${monthName.slice(0, 3)}*: ${staffNames}\n`;
  });

  text += `\n------------------------------------\n`;
  text += `_Generated via Staff Roster App (PWA)_`;
  return text;
}
