import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { user, ready, login } = useAuth();
  const [email, setEmail] = useState('admin@aljadaalmushriqa.ae');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to="/" replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <section className="login-card">
        <div className="login-hero">
          <div className="brand light">
            <span className="brand-mark">A</span>
            <div>
              <strong>Aljada</strong>
              <small>Task desk</small>
            </div>
          </div>
          <h1>Plan, prioritize, and accomplish your tasks with ease.</h1>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <p className="eyebrow">Aljada Al Mushriqa</p>
          <h2>Sign in to the task desk</h2>
          <p className="login-lead">Internal admin access for employees and assigned work.</p>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn wide" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="login-note">Admin · admin@aljadaalmushriqa.ae · Admin@123</p>
        </form>
      </section>
    </div>
  );
}
