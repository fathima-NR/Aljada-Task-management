import { useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import { avatarColor, emptyEmployee, initials } from '../utils';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyEmployee);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api('/api/employees');
    setEmployees(data.employees);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  function startCreate() {
    setEditing(null);
    setForm(emptyEmployee);
    setError('');
    setOpen(true);
  }

  function startEdit(person) {
    setEditing(person);
    setForm({
      name: person.name,
      email: person.email,
      role: person.role,
      department: person.department,
    });
    setError('');
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editing) {
        await api(`/api/employees/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/api/employees', { method: 'POST', body: JSON.stringify(form) });
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeEmployee() {
    setBusy(true);
    setError('');
    try {
      await api(`/api/employees/${confirm.id}`, { method: 'DELETE' });
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="list-page">
      <div className="page-head">
        <div>
          <h1>Employees</h1>
          <p>Add the people who receive tasks, and keep their details up to date.</p>
        </div>
        <button className="btn" type="button" onClick={startCreate}>+ Add employee</button>
      </div>

      {error && !open && !confirm && <p className="form-error">{error}</p>}

      <section className="employee-grid">
        {employees.map((person) => (
          <article key={person.id} className="employee-card">
            <span className="avatar xl" style={{ background: avatarColor(person.id) }}>{initials(person.name)}</span>
            <h2>{person.name}</h2>
            <p>{person.role}</p>
            <small>{person.department}</small>
            <a href={`mailto:${person.email}`}>{person.email}</a>
            <div className="employee-meta">
              <strong>{person.taskCount}</strong>
              <span>{person.taskCount === 1 ? 'task' : 'tasks'}</span>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => startEdit(person)}>Edit</button>
              <button type="button" className="danger" onClick={() => { setError(''); setConfirm(person); }}>Remove</button>
            </div>
          </article>
        ))}
      </section>

      {open && (
        <Modal
          title={editing ? 'Edit employee' : 'New employee'}
          subtitle="Name, work email, role, and department."
          onClose={() => setOpen(false)}
        >
          <form className="stack-form" onSubmit={save}>
            <label>
              Name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </label>
            <div className="form-grid">
              <label>
                Role
                <input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} required />
              </label>
              <label>
                Department
                <input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required />
              </label>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button className="btn ghost" type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save employee'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirm && (
        <Modal title="Remove employee" subtitle={confirm.name} onClose={() => { setConfirm(null); setError(''); }}>
          <p className="confirm-copy">Employees with assigned tasks need those tasks moved or deleted first.</p>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button className="btn ghost" type="button" onClick={() => { setConfirm(null); setError(''); }}>Cancel</button>
            <button className="btn danger" type="button" onClick={removeEmployee} disabled={busy}>Remove</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
