import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [roleMode, setRoleMode] = useState('student'); // 'student' or 'teacher'
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      // Validate role matches
      if ((roleMode === 'teacher' && user.role !== 'admin') || (roleMode === 'student' && user.role !== 'student')) {
        setError(`Error: You are trying to login as ${roleMode} but your account is ${user.role === 'admin' ? 'teacher' : 'student'}.`);
        return;
      }
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-black text-center text-primary mb-2">Campus Glide</h2>
        
        {/* Role Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button type="button" onClick={() => setRoleMode('student')} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${roleMode === 'student' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Student Login</button>
          <button type="button" onClick={() => setRoleMode('teacher')} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${roleMode === 'teacher' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Teacher Login</button>
        </div>
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 shadow-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-2 rounded hover:bg-blue-800 transition">Login</button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-500 mb-6">
          <a href="#" className="hover:underline">Forgot Password?</a>
        </div>
        
        {/* Demo Credentials Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 border-b border-blue-200 pb-1">Demo Credentials</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-bold text-gray-700">Teacher / Admin</p>
              <p className="text-gray-600 select-all font-mono text-xs mt-1">admin@college.edu</p>
              <p className="text-gray-500 font-mono text-xs select-all">password123</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">Sample Student</p>
              <p className="text-gray-600 select-all font-mono text-xs mt-1">student@college.edu</p>
              <p className="text-gray-500 font-mono text-xs select-all">password123</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}