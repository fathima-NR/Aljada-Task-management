import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Login from './pages/Login';
import Tasks from './pages/Tasks';

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="boot">Loading your desk…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, ready } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={ready && user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="employees" element={<Employees />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
