import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';

import DriverTracker from './pages/DriverTracker';

const PrivateRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  const { user } = useContext(AuthContext);
  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to={`/${user.role}`} /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />
        <Route path="/driver/:busNo" element={<DriverTracker />} />
        <Route path="/admin/*" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/student/*" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;