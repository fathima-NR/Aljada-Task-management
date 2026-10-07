import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  createdAt: { type: String, required: true },
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  priority: { type: String, required: true },
  dueDate: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

export const Employee = mongoose.model('Employee', employeeSchema);
export const Task = mongoose.model('Task', taskSchema);
export const User = mongoose.model('User', userSchema);

let memoryServer;

export async function connectDb() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    process.env.MONGOMS_DOWNLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.mongo');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('MONGODB_URI is not set. Using a temporary local database.');
  }
  await mongoose.connect(uri);
  await seed();
}

async function seed() {
  const existing = await User.findOne().select('_id');
  if (existing) return;

  await User.create({
    name: 'Amina Rahman',
    email: 'admin@aljadaalmushriqa.ae',
    passwordHash: bcrypt.hashSync('Admin@123', 10),
  });

  const people = [
    ['Sara Al Mansoori', 'sara@aljadaalmushriqa.ae', 'Brand Manager', 'Marketing', '2026-09-02'],
    ['Omar Hassan', 'omar@aljadaalmushriqa.ae', 'Content Lead', 'Content', '2026-09-04'],
    ['Layla Rahman', 'layla@aljadaalmushriqa.ae', 'Graphic Designer', 'Design', '2026-09-08'],
    ['Yusuf Karim', 'yusuf@aljadaalmushriqa.ae', 'Account Manager', 'Accounts', '2026-09-11'],
    ['Noor Al Farsi', 'noor@aljadaalmushriqa.ae', 'Social Media Specialist', 'Social', '2026-09-15'],
    ['Hana Ibrahim', 'hana@aljadaalmushriqa.ae', 'Campaign Coordinator', 'Marketing', '2026-09-18'],
  ];
  const employees = await Employee.insertMany(people.map(([name, email, role, department, createdAt]) => ({
    name, email, role, department, createdAt,
  })));
  const byEmail = Object.fromEntries(employees.map((person) => [person.email, person._id]));

  const tasks = [
    ['Q4 brand campaign brief', 'Outline the autumn campaign story, channels, and launch dates for the internal review.', 'sara@aljadaalmushriqa.ae', 'high', '2026-10-10', 'in-progress', '2026-10-01'],
    ['Instagram content calendar', 'Plan two weeks of posts, reels, and stories for the Desert Bloom account.', 'noor@aljadaalmushriqa.ae', 'medium', '2026-10-09', 'pending', '2026-10-02'],
    ['Client proposal for Desert Bloom', 'Prepare the scope, timeline, and fee summary for the new retainer.', 'yusuf@aljadaalmushriqa.ae', 'high', '2026-10-08', 'in-progress', '2026-10-03'],
    ['Homepage banner refresh', 'Design the new homepage hero and export assets for web.', 'layla@aljadaalmushriqa.ae', 'medium', '2026-10-05', 'completed', '2026-09-30'],
    ['Email newsletter draft', 'Write the October newsletter covering offers, events, and a client story.', 'omar@aljadaalmushriqa.ae', 'low', '2026-10-12', 'pending', '2026-10-04'],
    ['Photoshoot shot list', 'List the products, sets, and talent needed for Thursday’s studio day.', 'layla@aljadaalmushriqa.ae', 'high', '2026-10-11', 'pending', '2026-10-05'],
    ['Monthly performance report', 'Summarise reach, leads, and spend for the September campaigns.', 'sara@aljadaalmushriqa.ae', 'medium', '2026-10-04', 'completed', '2026-09-29'],
    ['Influencer outreach list', 'Shortlist creators in the UAE and draft the first outreach note.', 'noor@aljadaalmushriqa.ae', 'medium', '2026-10-14', 'in-progress', '2026-10-06'],
    ['Budget review with finance', 'Confirm the remaining Q4 media budget before new bookings.', 'hana@aljadaalmushriqa.ae', 'high', '2026-10-07', 'pending', '2026-10-06'],
    ['Landing page copy', 'Write the headline, benefits, and call to action for the new offer page.', 'omar@aljadaalmushriqa.ae', 'medium', '2026-10-13', 'in-progress', '2026-10-03'],
    ['Event booth design', 'Finalise the booth layout and print files for the trade show.', 'layla@aljadaalmushriqa.ae', 'low', '2026-10-02', 'completed', '2026-09-28'],
    ['New client onboarding kit', 'Assemble the welcome deck, contacts, and first-week checklist.', 'yusuf@aljadaalmushriqa.ae', 'medium', '2026-10-16', 'pending', '2026-10-07'],
    ['Ramadan teaser storyboard', 'Sketch the opening frames for the early teaser film.', 'layla@aljadaalmushriqa.ae', 'low', '2026-10-01', 'completed', '2026-09-27'],
    ['Vendor shortlist', 'Compare three print vendors and recommend one for the booth kit.', 'hana@aljadaalmushriqa.ae', 'medium', '2026-10-03', 'completed', '2026-09-26'],
    ['Weekly social report', 'Pull last week’s post results and note what to repeat.', 'noor@aljadaalmushriqa.ae', 'low', '2026-10-15', 'completed', '2026-10-05'],
  ];
  await Task.insertMany(tasks.map(([title, description, email, priority, dueDate, status, createdAt]) => ({
    title,
    description,
    employee: byEmail[email],
    priority,
    dueDate,
    status,
    createdAt,
  })));
}
