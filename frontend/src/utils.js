export function initials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function avatarColor(id) {
  const colors = ['#1f7a4c', '#146b45', '#2f6f8f', '#8a5a2b', '#6b4c9a', '#1d4e89'];
  const text = String(id || '');
  const total = [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[total % colors.length];
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dueLabel(value, status) {
  if (!value) return '';
  if (status === 'completed') return `Done ${formatDate(value)}`;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const due = new Date(`${value}T12:00:00`);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export function statusLabel(status) {
  if (status === 'in-progress') return 'In progress';
  if (status === 'completed') return 'Completed';
  return 'Pending';
}

export const emptyTask = {
  title: '',
  description: '',
  employeeId: '',
  priority: 'medium',
  dueDate: '',
  status: 'pending',
};

export const emptyEmployee = {
  name: '',
  email: '',
  role: '',
  department: '',
};
