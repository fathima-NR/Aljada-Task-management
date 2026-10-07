import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { avatarColor, dueLabel, formatDate, initials, statusLabel } from '../utils';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const barsRef = useRef(null);

  useEffect(() => {
    api('/api/dashboard')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const el = barsRef.current;
    if (!el || !data) return undefined;
    el.scrollLeft = el.scrollWidth;
    const frame = requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth;
    });

    let dragging = false;
    let startX = 0;
    let startLeft = 0;

    function onDown(event) {
      if (event.button !== 0) return;
      dragging = true;
      startX = event.clientX;
      startLeft = el.scrollLeft;
      el.classList.add('dragging');
      el.setPointerCapture(event.pointerId);
    }
    function onMove(event) {
      if (!dragging) return;
      el.scrollLeft = startLeft - (event.clientX - startX);
    }
    function onUp() {
      dragging = false;
      el.classList.remove('dragging');
    }

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [data]);

  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <div className="boot">Loading dashboard…</div>;

  const maxBar = Math.max(1, ...data.analytics.map((item) => item.count));
  const rate = data.totals.completionRate;
  const dash = `${(rate / 100) * 301.6} 301.6`;

  return (
    <div className="dashboard">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Plan, prioritize, and accomplish your tasks with ease.</p>
        </div>
      </div>

      <section className="stats">
        <article className="stat dark">
          <span className="stat-icon"><PeopleIcon /></span>
          <strong>{data.totals.employees}</strong>
          <span>Total employees</span>
          <small>People on the team</small>
        </article>
        <article className="stat">
          <span className="stat-icon soft"><CheckIcon /></span>
          <strong>{data.totals.completed}</strong>
          <span>Completed tasks</span>
          <small>Finished work</small>
        </article>
        <article className="stat">
          <span className="stat-icon soft"><ProgressIcon /></span>
          <strong>{data.totals.inProgress}</strong>
          <span>In progress</span>
          <small>Currently active</small>
        </article>
        <article className="stat">
          <span className="stat-icon soft"><ClockIcon /></span>
          <strong>{data.totals.pending}</strong>
          <span>Pending tasks</span>
          <small>Not started yet</small>
        </article>
      </section>

      <section className="panel week-panel">
        <div className="panel-head">
          <h2>Week calendar</h2>
          <span>{data.calendar.label}</span>
        </div>
        {data.calendar.earlierOverdue > 0 && (
          <Link className="overdue-note" to="/tasks?due=overdue">
            {data.calendar.earlierOverdue} overdue from earlier
          </Link>
        )}
        <div className="week">
          {data.calendar.days.map((day) => (
            <Link
              key={day.date}
              className={`week-day${day.isToday ? ' today' : ''}${day.overdue ? ' overdue' : ''}`}
              to={`/tasks?due=${day.date}`}
            >
              <span className="week-name">{day.weekday}</span>
              <strong>{day.day}</strong>
              {day.tasks.length === 0 ? (
                <small>Clear</small>
              ) : (
                <ul>
                  {day.tasks.map((task) => (
                    <li key={task.id} className={task.status}>
                      <span className={`dot ${task.priority}`} />
                      <span>{task.title}</span>
                    </li>
                  ))}
                </ul>
              )}
              {day.more > 0 && <small>+{day.more} more</small>}
            </Link>
          ))}
        </div>
      </section>

      <section className="dash-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>Task analytics</h2>
            <span>Drag to earlier days</span>
          </div>
          <div className="bars" ref={barsRef}>
            {data.analytics.map((item) => (
              <div key={item.date} className="bar-col">
                <div className="bar-track">
                  <div className="bar" style={{ height: `${Math.max(8, (item.count / maxBar) * 100)}%` }} />
                </div>
                <strong>{item.count}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Reminders</h2>
            <Link to="/tasks?status=pending">View tasks</Link>
          </div>
          <ul className="reminders">
            {data.reminders.map((task) => (
              <li key={task.id}>
                <span className={`dot ${task.priority}`} />
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.employeeName} · {dueLabel(task.dueDate, task.status)}</small>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="dash-bottom">
        <article className="panel">
          <div className="panel-head">
            <h2>Recent tasks</h2>
            <Link to="/tasks">See all</Link>
          </div>
          <ul className="task-mini">
            {data.recentTasks.map((task) => (
              <li key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.employeeName} · {formatDate(task.dueDate)}</small>
                </div>
                <span className={`pill ${task.status}`}>{statusLabel(task.status)}</span>
              </li>
            ))}
          </ul>
        </article>

        <div className="stack">
          <article className="panel">
            <div className="panel-head">
              <h2>Team</h2>
              <Link to="/employees">Manage</Link>
            </div>
            <div className="team-row">
              {data.team.slice(0, 5).map((person) => (
                <span key={person.id} className="avatar lg" style={{ background: avatarColor(person.id) }} title={person.name}>
                  {initials(person.name)}
                </span>
              ))}
              <div>
                <strong>{data.totals.employees} employees</strong>
                <small>{data.team.reduce((sum, person) => sum + person.openCount, 0)} open tasks</small>
              </div>
            </div>
          </article>
          <div className="split">
            <article className="panel progress-card">
              <h2>Task progress</h2>
              <div className="ring-wrap">
                <svg viewBox="0 0 120 120" className="ring">
                  <circle cx="60" cy="60" r="48" />
                  <circle cx="60" cy="60" r="48" className="value" strokeDasharray={dash} />
                </svg>
                <strong>{rate}%</strong>
              </div>
              <small>{data.totals.completed} of {data.totals.tasks} completed</small>
            </article>
            <article className="panel due-card">
              <h2>Due today</h2>
              <strong>{data.totals.dueToday}</strong>
              <p>{data.dueToday[0]?.title || 'Nothing is due today.'}</p>
              <small>{data.dueToday[0]?.employeeName || 'The board is clear'}</small>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.8" />
      <path d="M16 3.2a3.2 3.2 0 0 1 0 6.4" />
    </svg>
  );
}
function CheckIcon() {
  return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M8.5 12.5l2.2 2.2 4.8-5" /></svg>;
}
function ProgressIcon() {
  return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>;
}
function ClockIcon() {
  return <svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="3" /><path d="M9 4.5V3M15 4.5V3M8 10h8" /></svg>;
}
