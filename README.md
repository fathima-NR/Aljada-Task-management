# Aljada Task Desk

Internal admin dashboard for Aljada Al Mushriqa Marketing Management. Admins sign in, manage employees, and assign tasks with priority, due date, and status.

## Stack

- React and Vite for the interface
- Node.js and Express for the API
- MongoDB for employees, tasks, and the admin account

## Run it locally

Create a free database at [MongoDB Atlas](https://www.mongodb.com/atlas). Allow access from anywhere, then copy the connection string into `backend/.env`:

```bash
copy backend\.env.example backend\.env
```

Set `MONGODB_URI` in that file. From this folder:

```bash
npm install
npm run install:all
npm run dev
```

Open http://localhost:5173

The API runs at http://localhost:4000. The first start loads the sample team and tasks.

## Sign in

- Email: `admin@aljadaalmushriqa.ae`
- Password: `Admin@123`

## Deploy

The API goes on Render. The website goes on Vercel. Use the same Atlas database for both so the data stays after a restart.

**Render**

1. New Web Service from this repository.
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment variables:
   - `MONGODB_URI` — the Atlas connection string
   - `JWT_SECRET` — a long random string
   - `CLIENT_ORIGIN` — the Vercel site URL, added after the site exists

The health check is `/api/health`.

**Vercel**

1. New project from this repository.
2. Root directory: `frontend`
3. Framework preset: Vite
4. Environment variable: `VITE_API_URL` = the Render URL, with no slash at the end, for example `https://aljada-task-api.onrender.com`
5. Deploy again after `CLIENT_ORIGIN` on Render is set to the Vercel URL.

## What you can do

- Sign in to the dashboard
- See employee and task totals, including pending, in progress, and completed
- Add, edit, and remove employees
- Create, edit, and delete tasks
- Assign a task to an employee and set priority, due date, and status
- Change a task status from the list
- Filter tasks by employee, status, priority, or due date, and search from the top bar
- See the week on a calendar, with today highlighted and overdue days marked
