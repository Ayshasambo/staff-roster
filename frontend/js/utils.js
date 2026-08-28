/**
 * Utilities & Helper Functions
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Format Date to full Nigerian display format
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
  text += `Status: ${roster.status === 'published' ? '✅ Published' : '📝 Draft'}\n`;
  text += `------------------------------------\n\n`;

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

/**
 * Toast Notification Dispatcher
 */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '⚠️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 300ms ease, transform 300ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Built-in Canvas Confetti Particle Burst
 */
export function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#047857', '#ffffff', '#cbd5e1'];

  for (let i = 0; i < 70; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      r: Math.random() * 6 + 3,
      d: Math.random() * 70,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
      tiltAngle: 0,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.5) * 16 - 6,
      alpha: 1
    });
  }

  let animationFrame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeCount = 0;

    particles.forEach((p) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // Gravity
      p.alpha -= 0.012;

      if (p.alpha > 0) {
        activeCount++;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.moveTo(p.x + p.tilt + p.r, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();
      }
    });

    if (activeCount > 0) {
      animationFrame = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animationFrame);
      canvas.remove();
    }
  }

  draw();
}
