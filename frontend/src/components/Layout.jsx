import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { avatarColor, initials } from '../utils';

const links = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/tasks', label: 'Tasks', icon: TasksIcon },
  { to: '/employees', label: 'Employees', icon: TeamIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  function search(event) {
    event.preventDefault();
    navigate(`/tasks?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  }

  return (
    <div className="shell">
      {open && <button className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <strong>Aljada</strong>
            <small>Task desk</small>
          </div>
        </div>
        <p className="nav-label">Menu</p>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="nav-link" onClick={() => setOpen(false)}>
              <link.icon />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="nav-link quiet" type="button" onClick={logout}>
            <LogoutIcon />
            Log out
          </button>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <button className="icon-btn menu-btn" type="button" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <form className="search" onSubmit={search}>
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks or employees"
              aria-label="Search tasks or employees"
            />
          </form>
          <div className="top-actions">
            <button className="btn" type="button" onClick={() => navigate('/tasks?new=1')}>+ Add task</button>
            <div className="who">
              <span className="avatar" style={{ background: avatarColor(user?.id || 1) }}>{initials(user?.name)}</span>
              <div>
                <strong>{user?.name}</strong>
                <small>Admin</small>
              </div>
            </div>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </section>
    </div>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.4" />
      <path d="M4.5 19c.6-2.6 2.5-4 4.5-4s3.9 1.4 4.5 4" />
      <path d="M14 15.2c1.3-.4 2.6-.2 3.6.8.6.6 1 1.4 1.2 2.2" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h11M12 8l4 4-4 4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}
