import { format, isToday, isTomorrow, isPast, isAfter, parseISO, differenceInCalendarDays } from 'date-fns';

// ── Greeting ────────────────────────────────────────────────────────────────
export function getGreeting(name = '') {
  const hour = new Date().getHours();
  let greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  return name ? `${greeting}, ${name}! 👋` : `${greeting}! 👋`;
}

// ── Date helpers ─────────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch {
    return timeStr;
  }
}

export function isOverdue(task) {
  if (!task.dueDate || task.completed || task.archived) return false;
  try {
    const due = parseISO(task.dueDate);
    if (task.dueTime) {
      // Has a specific time — overdue if that exact datetime is past
      const [h, m] = task.dueTime.split(':').map(Number);
      due.setHours(h, m, 59, 999);
    } else {
      // No time — overdue only after the end of that day
      due.setHours(23, 59, 59, 999);
    }
    return isPast(due);
  } catch {
    return false;
  }
}

export function isTodayTask(task) {
  if (!task.dueDate) return false;
  return isToday(parseISO(task.dueDate));
}

export function isUpcomingTask(task) {
  if (!task.dueDate) return false;
  const due = parseISO(task.dueDate);
  return isAfter(due, new Date()) && !isToday(due);
}

export function getRelativeDueDate(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    const due = parseISO(dateStr);
    if (timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      due.setHours(h, m, 0, 0);
      if (isPast(due)) return { label: 'Overdue', color: '#ef4444' };
      const diffMs = due - new Date();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60)  return { label: `Due in ${diffMins}m`, color: '#f59e0b' };
      if (diffMins < 1440) return { label: `Due in ${Math.floor(diffMins/60)}h ${diffMins%60}m`, color: '#f59e0b' };
    }
    if (isToday(due))    return { label: 'Today',    color: '#f59e0b' };
    if (isTomorrow(due)) return { label: 'Tomorrow', color: '#3b82f6' };
    if (isPast(due))     return { label: 'Overdue',  color: '#ef4444' };
    const days = differenceInCalendarDays(due, new Date());
    return { label: `In ${days} day${days !== 1 ? 's' : ''}`, color: '#10b981' };
  } catch {
    return null;
  }
}

// ── ID generator ─────────────────────────────────────────────────────────────
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Export / Import ───────────────────────────────────────────────────────────
export function exportToJSON(data, filename = 'ars-smarttrack-backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try { resolve(JSON.parse(e.target.result)); }
      catch { reject(new Error('Invalid JSON file')); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ── Motivational Quotes ───────────────────────────────────────────────────────
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It's not about having time. It's about making time.", author: "Unknown" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
  { text: "You can do anything, but not everything.", author: "David Allen" },
  { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
  { text: "Work smarter, not harder.", author: "Unknown" },
  { text: "Take care of the minutes and the hours will take care of themselves.", author: "Lord Chesterfield" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Small steps every day add up to giant leaps over time.", author: "Unknown" },
];

export function getDailyQuote() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

// ── Streak calculation ────────────────────────────────────────────────────────
export function calculateStreak(completedDates) {
  if (!completedDates || completedDates.length === 0) return 0;
  const uniqueDays = [...new Set(completedDates.map(d => d.slice(0, 10)))].sort().reverse();
  let streak = 0;
  let expected = format(new Date(), 'yyyy-MM-dd');
  for (const day of uniqueDays) {
    if (day === expected) {
      streak++;
      const prev = new Date(expected);
      prev.setDate(prev.getDate() - 1);
      expected = format(prev, 'yyyy-MM-dd');
    } else break;
  }
  return streak;
}

// ── Category colors ───────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Personal: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Work:      'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300',
  Study:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  Health:    'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-300',
  Shopping:  'bg-pink-100   text-pink-700   dark:bg-pink-900/40   dark:text-pink-300',
  Finance:   'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
};

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300';
}

// ── Stats helpers ─────────────────────────────────────────────────────────────
export function computeStats(tasks) {
  const active = tasks.filter(t => !t.archived);
  const total     = active.length;
  const completed = active.filter(t => t.completed).length;
  const pending   = active.filter(t => !t.completed).length;
  const overdue   = active.filter(isOverdue).length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pending, overdue, pct };
}

// ── Last 7 days labels ────────────────────────────────────────────────────────
export function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return format(d, 'EEE');
  });
}

export function getCompletedPerDay(tasks) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = format(d, 'yyyy-MM-dd');
    return tasks.filter(
      t => t.completed && t.completedAt && t.completedAt.slice(0, 10) === dateStr
    ).length;
  });
}
