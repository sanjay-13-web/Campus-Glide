const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, 'client');

const files = {
  'src/pages/StudentDashboard.jsx': `import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { FiClock, FiCheckCircle, FiXCircle, FiBell } from 'react-icons/fi';

export default function StudentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [bus, setBus] = useState(null);
  const [arrival, setArrival] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [busRes, arrRes, attRes, notifRes] = await Promise.all([
        api.get('/student/bus'),
        api.get(\`/bus/\${user.busNo}/arrival\`),
        api.get('/student/attendance'),
        api.get('/student/notifications')
      ]);
      setBus(busRes.data);
      setArrival(arrRes.data);
      setAttendance(attRes.data);
      setNotifications(notifRes.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching data');
      setLoading(false);
    }
  };

  const handleAttendance = async (status) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.post('/student/attendance', { status, date: today });
      setSuccess(\`Attendance marked as \${status.toUpperCase()}\`);
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Error marking attendance');
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const markRead = async (id) => {
    await api.put(\`/student/notifications/\${id}/read\`);
    fetchData();
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.find(a => a.date === today);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">College Bus System</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user.name}</span>
          <button onClick={logout} className="text-sm bg-blue-800 px-3 py-1 rounded">Logout</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {error && <div className="col-span-1 md:col-span-2 bg-red-100 text-red-700 p-3 rounded">{error}</div>}
        {success && <div className="col-span-1 md:col-span-2 bg-green-100 text-green-700 p-3 rounded">{success}</div>}
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Your Bus</h2>
          <div className="text-3xl font-bold text-primary mb-2">BUS {user.busNo}</div>
          <p className="text-gray-600">Route: {bus?.route || 'N/A'}</p>
          <p className="text-gray-600">Pickup: {user.pickupLocation}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">
            <FiClock /> Expected Arrival
          </h2>
          <div className="text-3xl font-bold text-orange-500 mb-2">{arrival?.estimatedArrival || 0} minutes</div>
          <p className="text-gray-600">Bus is currently at: {arrival?.currentLocation || 'Unknown'}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow col-span-1 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Today's Attendance ({today})</h2>
          {todayAttendance ? (
            <div className="flex items-center gap-2 text-lg">
              Status: 
              <span className={\`font-bold \${todayAttendance.status === 'present' ? 'text-green-600' : 'text-red-600'}\`}>
                {todayAttendance.status.toUpperCase()}
              </span>
            </div>
          ) : (
            <div>
              <p className="mb-4">Are you travelling today?</p>
              <div className="flex gap-4">
                <button onClick={() => handleAttendance('present')} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                  <FiCheckCircle /> PRESENT
                </button>
                <button onClick={() => handleAttendance('absent')} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
                  <FiXCircle /> ABSENT
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow col-span-1 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">
            <FiBell /> Notifications
          </h2>
          {notifications.length === 0 ? <p className="text-gray-500">No notifications</p> : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n._id} className={\`p-3 rounded border \${n.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}\`}>
                  <div className="flex justify-between">
                    <span className="font-semibold">{n.type === 'arrival' ? '🚌 Bus Arrival' : '🔔 Alert'}</span>
                    {!n.read && <button onClick={() => markRead(n._id)} className="text-xs text-blue-600 underline">Mark as read</button>}
                  </div>
                  <p className="mt-1">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}`,

  'src/pages/AdminDashboard.jsx': `import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  // New Student Form State
  const [newStudent, setNewStudent] = useState({ name: '', studentId: '', email: '', password: '', busNo: '', parentPhone: '', pickupLocation: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === 'dashboard') {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } else if (activeTab === 'students') {
      const res = await api.get('/admin/students');
      setStudents(res.data);
      const bRes = await api.get('/bus');
      setBuses(bRes.data);
    } else if (activeTab === 'attendance') {
      const res = await api.get('/admin/attendance');
      setAttendance(res.data);
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/students', newStudent);
      alert('Student registered successfully');
      setNewStudent({ name: '', studentId: '', email: '', password: '', busNo: '', parentPhone: '', pickupLocation: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering student');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-bold text-primary mb-6">Admin Panel</h2>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('dashboard')} className={\`text-left p-2 rounded \${activeTab === 'dashboard' ? 'bg-blue-100 text-primary' : 'hover:bg-gray-100'}\`}>Dashboard</button>
          <button onClick={() => setActiveTab('students')} className={\`text-left p-2 rounded \${activeTab === 'students' ? 'bg-blue-100 text-primary' : 'hover:bg-gray-100'}\`}>Students</button>
          <button onClick={() => setActiveTab('attendance')} className={\`text-left p-2 rounded \${activeTab === 'attendance' ? 'bg-blue-100 text-primary' : 'hover:bg-gray-100'}\`}>Attendance</button>
          <button onClick={logout} className="text-left p-2 rounded text-red-600 hover:bg-red-50 mt-auto">Logout</button>
        </nav>
      </aside>
      
      <main className="flex-1 p-6">
        {activeTab === 'dashboard' && stats && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="text-gray-500">Total Students</div>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-gray-500">Total Buses</div>
                <div className="text-2xl font-bold">{stats.totalBuses}</div>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                <div className="text-gray-500">Present Today</div>
                <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
                <div className="text-gray-500">Absent Today</div>
                <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-bold mb-4">Register New Student</h3>
              <form onSubmit={handleRegisterStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Student Name" className="border p-2 rounded" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                <input type="text" placeholder="Student ID" className="border p-2 rounded" required value={newStudent.studentId} onChange={e => setNewStudent({...newStudent, studentId: e.target.value})} />
                <input type="email" placeholder="Email" className="border p-2 rounded" required value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
                <input type="password" placeholder="Password" className="border p-2 rounded" required value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} />
                <select className="border p-2 rounded" required value={newStudent.busNo} onChange={e => setNewStudent({...newStudent, busNo: e.target.value})}>
                  <option value="">Select Bus</option>
                  {buses.map(b => <option key={b._id} value={b.busNo}>Bus {b.busNo}</option>)}
                </select>
                <input type="text" placeholder="Parent Phone" className="border p-2 rounded" required value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} />
                <input type="text" placeholder="Pickup Location" className="border p-2 rounded" required value={newStudent.pickupLocation} onChange={e => setNewStudent({...newStudent, pickupLocation: e.target.value})} />
                <button type="submit" className="bg-primary text-white p-2 rounded col-span-1 md:col-span-2">Register Student</button>
              </form>
            </div>
            
            <div className="bg-white p-6 rounded shadow overflow-x-auto">
              <h3 className="text-lg font-bold mb-4">Students List</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Bus No</th>
                    <th className="p-2 border">Parent Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id} className="border-b">
                      <td className="p-2 border">{s.studentId}</td>
                      <td className="p-2 border">{s.name}</td>
                      <td className="p-2 border font-bold">Bus {s.busNo}</td>
                      <td className="p-2 border">{s.parentPhone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white p-6 rounded shadow overflow-x-auto">
            <h3 className="text-lg font-bold mb-4">Attendance Records</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Student ID</th>
                  <th className="p-2 border">Bus No</th>
                  <th className="p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a._id} className="border-b">
                    <td className="p-2 border">{a.date}</td>
                    <td className="p-2 border">{a.studentId}</td>
                    <td className="p-2 border">Bus {a.busNo}</td>
                    <td className="p-2 border">
                      <span className={\`px-2 py-1 rounded text-xs text-white \${a.status === 'present' ? 'bg-green-500' : 'bg-red-500'}\`}>
                        {a.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}`
};

for (const [relPath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(clientDir, relPath), content);
}

console.log('Frontend pages generated successfully.');
