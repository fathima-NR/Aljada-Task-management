import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectDb, Employee, Task, User } from './db.js';

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'aljada-task-dashboard-secret';
const STATUSES = ['pending', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const app = express();
const clientOrigin = String(process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(clientOrigin.length ? cors({ origin: clientOrigin }) : cors());
app.use(express.json());

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

function mapEmployee(person, taskCount = 0) {
  return {
    id: String(person._id),
    name: person.name,
    email: person.email,
    role: person.role,
    department: person.department,
    createdAt: person.createdAt,
    taskCount,
  };
}

function mapTask(task) {
  const employee = task.employee && task.employee.name ? task.employee : null;
  return {
    id: String(task._id),
    title: task.title,
    description: task.description,
    employeeId: employee ? String(employee._id) : String(task.employee || ''),
    employeeName: employee?.name || '',
    employeeRole: employee?.role || '',
    priority: task.priority,
    dueDate: task.dueDate,
    status: task.status,
    createdAt: task.createdAt,
  };
}

function compareTasks(left, right) {
  if (left.dueDate !== right.dueDate) return left.dueDate < right.dueDate ? -1 : 1;
  return PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function employeeWithCount(id) {
  const person = await Employee.findById(id);
  if (!person) return null;
  const taskCount = await Task.countDocuments({ employee: person._id });
  return mapEmployee(person, taskCount);
}

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ ok: connected });
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const user = await User.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Those sign-in details are not correct.' });
  }
  const token = jwt.sign(
    { id: String(user._id), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  res.json({ token, user: { id: String(user._id), name: user.name, email: user.email } });
});

app.get('/api/auth/me', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.user.id)) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }
  const user = await User.findById(req.user.id).select('name email');
  if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
  res.json({ user: { id: String(user._id), name: user.name, email: user.email } });
});

app.get('/api/dashboard', auth, async (req, res) => {
  const today = localDateKey();
  const [employeeCount, statusGroups, openTasks, recent, people, analyticsCounts] = await Promise.all([
    Employee.countDocuments(),
    Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.find({ status: { $ne: 'completed' } }).populate('employee').sort({ dueDate: 1 }),
    Task.find().populate('employee').sort({ createdAt: -1, _id: -1 }).limit(5),
    Employee.find().sort({ name: 1 }),
    Task.aggregate([{ $group: { _id: '$createdAt', count: { $sum: 1 } } }]),
  ]);

  const byStatus = { pending: 0, 'in-progress': 0, completed: 0 };
  for (const row of statusGroups) byStatus[row._id] = row.count;
  const totalTasks = byStatus.pending + byStatus['in-progress'] + byStatus.completed;
  const dueToday = openTasks.filter((task) => task.dueDate === today).sort(compareTasks);
  const reminders = openTasks.slice(0, 4);
  const createdCounts = Object.fromEntries(analyticsCounts.map((row) => [row._id, row.count]));

  const taskGroups = await Task.aggregate([
    {
      $group: {
        _id: '$employee',
        taskCount: { $sum: 1 },
        openCount: { $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] } },
      },
    },
  ]);
  const groupByEmployee = Object.fromEntries(taskGroups.map((row) => [String(row._id), row]));
  const team = people
    .map((person) => {
      const group = groupByEmployee[String(person._id)] || { taskCount: 0, openCount: 0 };
      return { ...mapEmployee(person, group.taskCount), openCount: group.openCount };
    })
    .sort((left, right) => right.openCount - left.openCount || left.name.localeCompare(right.name));

  const analytics = [];
  for (let offset = 27; offset >= 0; offset -= 1) {
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const key = localDateKey(day);
    analytics.push({
      date: key,
      label: day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      count: createdCounts[key] || 0,
    });
  }

  res.json({
    totals: {
      employees: employeeCount,
      tasks: totalTasks,
      pending: byStatus.pending,
      inProgress: byStatus['in-progress'],
      completed: byStatus.completed,
      completionRate: totalTasks ? Math.round((byStatus.completed / totalTasks) * 100) : 0,
      dueToday: dueToday.length,
    },
    dueToday: dueToday.map(mapTask),
    reminders: reminders.map(mapTask),
    recentTasks: recent.map(mapTask),
    team,
    analytics,
    calendar: await weekCalendar(today),
  });
});

app.get('/api/employees', auth, async (req, res) => {
  const [people, groups] = await Promise.all([
    Employee.find().sort({ name: 1 }),
    Task.aggregate([{ $group: { _id: '$employee', taskCount: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(groups.map((row) => [String(row._id), row.taskCount]));
  res.json({
    employees: people.map((person) => mapEmployee(person, counts[String(person._id)] || 0)),
  });
});

app.post('/api/employees', auth, async (req, res) => {
  const parsed = readEmployee(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const duplicate = await Employee.findOne({ email: parsed.email }).select('_id');
  if (duplicate) return res.status(409).json({ message: 'An employee with this email already exists.' });
  const person = await Employee.create({ ...parsed, createdAt: localDateKey() });
  res.status(201).json({ employee: mapEmployee(person, 0) });
});

app.put('/api/employees/:id', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Employee not found.' });
  const current = await Employee.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Employee not found.' });
  const parsed = readEmployee(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const duplicate = await Employee.findOne({ email: parsed.email, _id: { $ne: current._id } }).select('_id');
  if (duplicate) return res.status(409).json({ message: 'An employee with this email already exists.' });
  current.set(parsed);
  await current.save();
  res.json({ employee: await employeeWithCount(current._id) });
});

app.delete('/api/employees/:id', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Employee not found.' });
  const current = await Employee.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Employee not found.' });
  const taskCount = await Task.countDocuments({ employee: current._id });
  if (taskCount) {
    return res.status(400).json({
      message: `${current.name} still has ${taskCount} task${taskCount === 1 ? '' : 's'}. Reassign or delete those tasks first.`,
    });
  }
  await current.deleteOne();
  res.json({ ok: true });
});

app.get('/api/tasks', auth, async (req, res) => {
  const filter = {};
  if (req.query.status && STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.priority && PRIORITIES.includes(req.query.priority)) filter.priority = req.query.priority;
  if (req.query.employeeId) {
    if (!mongoose.isValidObjectId(req.query.employeeId)) return res.json({ tasks: [] });
    filter.employee = req.query.employeeId;
  }
  if (req.query.due === 'overdue') {
    filter.dueDate = { $lt: localDateKey() };
    if (filter.status === 'completed') filter.status = '__none__';
    else if (!filter.status) filter.status = { $ne: 'completed' };
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.due || ''))) {
    filter.dueDate = req.query.due;
  }
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
    const matches = await Employee.find({ name: regex }).select('_id');
    filter.$or = [
      { title: regex },
      { description: regex },
      { employee: { $in: matches.map((person) => person._id) } },
    ];
  }
  const tasks = await Task.find(filter).populate('employee').sort({ dueDate: 1, _id: -1 });
  res.json({ tasks: tasks.map(mapTask) });
});

app.post('/api/tasks', auth, async (req, res) => {
  const parsed = await readTask(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const task = await Task.create({
    title: parsed.title,
    description: parsed.description,
    employee: parsed.employeeId,
    priority: parsed.priority,
    dueDate: parsed.dueDate,
    status: parsed.status,
    createdAt: localDateKey(),
  });
  await task.populate('employee');
  res.status(201).json({ task: mapTask(task) });
});

app.put('/api/tasks/:id', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Task not found.' });
  const current = await Task.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Task not found.' });
  const parsed = await readTask(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  current.set({
    title: parsed.title,
    description: parsed.description,
    employee: parsed.employeeId,
    priority: parsed.priority,
    dueDate: parsed.dueDate,
    status: parsed.status,
  });
  await current.save();
  await current.populate('employee');
  res.json({ task: mapTask(current) });
});

app.patch('/api/tasks/:id/status', auth, async (req, res) => {
  const status = req.body.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Choose a valid status.' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Task not found.' });
  const current = await Task.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Task not found.' });
  current.status = status;
  await current.save();
  await current.populate('employee');
  res.json({ task: mapTask(current) });
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Task not found.' });
  const current = await Task.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Task not found.' });
  await current.deleteOne();
  res.json({ ok: true });
});

async function weekCalendar(today) {
  const start = new Date(`${today}T12:00:00`);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startKey = localDateKey(start);
  const endKey = localDateKey(end);
  const rows = await Task.find({ dueDate: { $gte: startKey, $lte: endKey } }).sort({ title: 1 });
  rows.sort((left, right) => PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority]);
  const earlierOverdue = await Task.countDocuments({ dueDate: { $lt: startKey }, status: { $ne: 'completed' } });

  const days = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    const key = localDateKey(day);
    const items = rows.filter((task) => task.dueDate === key);
    const open = items.filter((task) => task.status !== 'completed').length;
    days.push({
      date: key,
      weekday: day.toLocaleDateString('en-GB', { weekday: 'short' }),
      day: day.getDate(),
      isToday: key === today,
      overdue: key < today && open > 0,
      open,
      more: Math.max(0, items.length - 3),
      tasks: items.slice(0, 3).map((task) => ({
        id: String(task._id),
        title: task.title,
        priority: task.priority,
        status: task.status,
      })),
    });
  }

  const startLabel = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endLabel = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return { label: `${startLabel} – ${endLabel}`, earlierOverdue, days };
}

function readEmployee(body) {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const role = String(body.role || '').trim();
  const department = String(body.department || '').trim();
  if (!name || !email || !role || !department) {
    return { error: 'Name, email, role, and department are required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  return { name, email, role, department };
}

async function readTask(body) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const employeeId = String(body.employeeId || '');
  const priority = body.priority;
  const dueDate = String(body.dueDate || '').trim();
  const status = body.status;
  if (!title) return { error: 'Task title is required.' };
  if (!PRIORITIES.includes(priority)) return { error: 'Choose a priority.' };
  if (!STATUSES.includes(status)) return { error: 'Choose a status.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return { error: 'Choose a due date.' };
  if (!mongoose.isValidObjectId(employeeId)) return { error: 'Assign the task to an employee.' };
  const employee = await Employee.findById(employeeId).select('_id');
  if (!employee) return { error: 'Assign the task to an employee.' };
  return { title, description, employeeId, priority, dueDate, status };
}

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
