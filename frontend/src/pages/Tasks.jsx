import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Modal from '../components/Modal';
import { avatarColor, dueLabel, emptyTask, formatDate, initials, statusLabel } from '../utils';

const statuses = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

const statusOptions = [
  { id: 'pending', label: 'Pending' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

function StatusMenu({ value, taskTitle, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div className={`status-menu ${open ? 'open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`status-trigger ${value}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Status for ${taskTitle}`}
        onClick={() => setOpen((current) => !current)}
      >
        {statusLabel(value)}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <ul className="status-list" role="listbox" aria-label={`Status for ${taskTitle}`}>
          {statusOptions.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === option.id}
                className={`${option.id}${value === option.id ? ' active' : ''}`}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                <span className="dot" />
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const priorities = [
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

function PriorityMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = priorities.find((item) => item.id === value);

  useEffect(() => {
    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function choose(next) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className={`menu-select ${open ? 'open' : ''}`} ref={rootRef}>
      <button type="button" className="menu-trigger" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((current) => !current)}>
        <span>Priority</span>
        <strong>{selected ? selected.label : 'All priorities'}</strong>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <ul className="menu-list priority-list" role="listbox" aria-label="Filter by priority">
          <li>
            <button type="button" role="option" aria-selected={!value} className={value ? '' : 'active'} onClick={() => choose('')}>
              All priorities
            </button>
          </li>
          {priorities.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === item.id}
                className={`${item.id}${value === item.id ? ' active' : ''}`}
                onClick={() => choose(item.id)}
              >
                <span className={`dot ${item.id}`} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmployeeMenu({ employees, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = employees.find((person) => String(person.id) === String(value));

  useEffect(() => {
    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function choose(next) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className={`menu-select ${open ? 'open' : ''}`} ref={rootRef}>
      <button type="button" className="menu-trigger" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((current) => !current)}>
        <span>Employee</span>
        <strong>{selected ? selected.name : 'All employees'}</strong>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <ul className="menu-list" role="listbox" aria-label="Filter by employee">
          <li>
            <button type="button" role="option" aria-selected={!value} className={value ? '' : 'active'} onClick={() => choose('')}>
              All employees
            </button>
          </li>
          {employees.map((person) => {
            const active = String(value) === String(person.id);
            return (
              <li key={person.id}>
                <button type="button" role="option" aria-selected={active} className={active ? 'active' : ''} onClick={() => choose(String(person.id))}>
                  <span className="avatar sm" style={{ background: avatarColor(person.id) }}>{initials(person.name)}</span>
                  <span className="menu-person">
                    <strong>{person.name}</strong>
                    <small>{person.role}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Tasks() {
  const [params, setParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyTask);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const status = params.get('status') || '';
  const employeeId = params.get('employeeId') || '';
  const priority = params.get('priority') || '';
  const due = params.get('due') || '';
  const q = params.get('q') || '';
  const creating = params.get('new') === '1';

  async function load() {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (employeeId) query.set('employeeId', employeeId);
    if (priority) query.set('priority', priority);
    if (due) query.set('due', due);
    if (q) query.set('q', q);
    const [taskData, employeeData] = await Promise.all([
      api(`/api/tasks?${query.toString()}`),
      api('/api/employees'),
    ]);
    setTasks(taskData.tasks);
    setEmployees(employeeData.employees);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [status, employeeId, priority, due, q]);

  useEffect(() => {
    if (creating && !editing && employees.length) {
      setForm((current) => (current.employeeId ? current : { ...emptyTask, employeeId: employees[0].id }));
    }
  }, [creating, editing, employees]);

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('new');
    setParams(next);
  }

  function openEdit(task) {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description,
      employeeId: task.employeeId,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
    });
    setError('');
    const next = new URLSearchParams(params);
    next.delete('new');
    setParams(next);
  }

  function closeForm() {
    setEditing(null);
    const next = new URLSearchParams(params);
    next.delete('new');
    setParams(next);
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, employeeId: form.employeeId };
      if (editing) {
        await api(`/api/tasks/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(task, nextStatus) {
    setError('');
    try {
      await api(`/api/tasks/${task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeTask() {
    setBusy(true);
    setError('');
    try {
      await api(`/api/tasks/${confirm.id}`, { method: 'DELETE' });
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const formOpen = creating || editing;

  return (
    <div className="list-page">
      <div className="page-head">
        <div>
          <h1>Tasks</h1>
          <p>Create work, assign it, and move it from pending to completed.</p>
        </div>
      </div>

      {error && !formOpen && <p className="form-error">{error}</p>}

      <section className="panel task-board">
        <div className="filters">
          <div className="tabs">
            {statuses.map((item) => (
              <button
                key={item.id || 'all'}
                type="button"
                className={status === item.id ? 'active' : ''}
                onClick={() => setFilter('status', item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="filter-menus">
            <PriorityMenu value={priority} onChange={(next) => setFilter('priority', next)} />
            <EmployeeMenu
              employees={employees}
              value={employeeId}
              onChange={(next) => setFilter('employeeId', next)}
            />
          </div>
          {due && (
            <button className="chip" type="button" onClick={() => setFilter('due', '')}>
              {due === 'overdue' ? 'Overdue' : `Due ${formatDate(due)}`} ×
            </button>
          )}
          {q && (
            <button className="chip" type="button" onClick={() => setFilter('q', '')}>
              Search: {q} ×
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="empty">No tasks match this view.</div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-row">
                <span className="avatar" style={{ background: avatarColor(task.employeeId) }}>{initials(task.employeeName)}</span>
                <div className="task-copy">
                  <div className="task-title">
                    <strong>{task.title}</strong>
                    <span className={`pill ${task.priority}`}>{task.priority}</span>
                  </div>
                  <p>{task.description || 'No description'}</p>
                  <small>{task.employeeName} · {task.employeeRole} · {formatDate(task.dueDate)} · {dueLabel(task.dueDate, task.status)}</small>
                </div>
                <div className="task-controls">
                  <StatusMenu
                    value={task.status}
                    taskTitle={task.title}
                    onChange={(next) => changeStatus(task, next)}
                  />
                  <div className="row-actions">
                    <button type="button" onClick={() => openEdit(task)}>Edit</button>
                    <button type="button" className="danger" onClick={() => setConfirm(task)}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {formOpen && (
        <Modal
          title={editing ? 'Edit task' : 'New task'}
          subtitle="Title, description, employee, priority, due date, and status."
          onClose={closeForm}
        >
          <form className="stack-form" onSubmit={save}>
            <label>
              Task title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </label>
            <label>
              Description
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} />
            </label>
            <div className="form-grid">
              <label>
                Assigned employee
                <select value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} required>
                  <option value="">Select employee</option>
                  {employees.map((person) => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                Due date
                <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} required />
              </label>
              <label>
                Status
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button className="btn ghost" type="button" onClick={closeForm}>Cancel</button>
              <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save task'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirm && (
        <Modal title="Delete task" subtitle={confirm.title} onClose={() => { setConfirm(null); setError(''); }}>
          <p className="confirm-copy">This removes the task from the board. The employee stays on the team.</p>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button className="btn ghost" type="button" onClick={() => { setConfirm(null); setError(''); }}>Cancel</button>
            <button className="btn danger" type="button" onClick={removeTask} disabled={busy}>Delete task</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
