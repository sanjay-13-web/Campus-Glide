import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { FiClock, FiCheckCircle, FiXCircle, FiBell, FiMapPin, FiPhoneCall, FiAlertTriangle, FiCloud } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon issue in react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom Bus Icon
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // a simple bus icon url
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

export default function StudentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [bus, setBus] = useState(null);
  const [arrival, setArrival] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [parentPhone, setParentPhone] = useState(user?.parentPhone || '');
  const [password, setPassword] = useState('');

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/student/profile', { parentPhone, password });
      alert('Profile updated successfully!');
      setShowSettings(false);
    } catch(err) {
      alert('Failed to update profile.');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [busRes, arrRes, attRes, notifRes] = await Promise.all([
        api.get('/student/bus'),
        api.get(`/bus/${user.busNo}/arrival`),
        api.get('/student/attendance'),
        api.get('/student/notifications')
      ]);
      setBus(busRes.data);
      setArrival(arrRes.data);
      setAttendance(attRes.data);
      setNotifications(notifRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      if(!bus) setLoading(false);
    }
  };

  const handleAttendance = async (status) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.post('/student/attendance', { status, date: today });
      setSuccess(`Attendance marked as ${status.toUpperCase()}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error marking attendance');
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleSOS = async () => {
    if (window.confirm("Are you sure you want to send an SOS Emergency alert to the Admin and your Parents?")) {
      try {
        await api.post('/student/sos');
        setSuccess('SOS Alert Sent Successfully! Help is on the way.');
      } catch(err) {
        setError('Error sending SOS.');
      }
      setTimeout(() => { setError(''); setSuccess(''); }, 5000);
    }
  };

  const markRead = async (id) => {
    if (String(id).startsWith('dynamic_')) {
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      return;
    }
    await api.put(`/student/notifications/${id}/read`);
    fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl text-primary font-bold">Loading your portal...</div>;

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.find(a => a.date === today);
  const position = bus && bus.lat && bus.lng ? [bus.lat, bus.lng] : [13.0827, 80.2707];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-primary text-white p-4 shadow-lg sticky top-0 z-50 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2"><FiMapPin /> Campus Glide Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline">Welcome, {user.name}</span>
          <button onClick={() => document.documentElement.classList.toggle('dark')} className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-800 transition shadow hidden md:block">🌙 Theme</button>
          <button onClick={() => setShowSettings(true)} className="text-sm bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition shadow">Settings</button>
          <button onClick={handleSOS} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-bold flex items-center gap-1 shadow">
            <FiAlertTriangle /> SOS
          </button>
          <button onClick={logout} className="text-sm bg-blue-800 px-3 py-1 rounded hover:bg-blue-900 transition">Logout</button>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="bg-primary text-white p-4 font-bold text-lg flex justify-between items-center">
              Profile Settings
              <button onClick={() => setShowSettings(false)} className="text-white hover:text-gray-200"><FiXCircle size={24}/></button>
            </div>
            <form onSubmit={updateProfile} className="p-6 text-gray-800">
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">Update Parent Phone</label>
                <input type="text" value={parentPhone} onChange={e => setParentPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">Change Password</label>
                <input type="password" placeholder="Leave blank to keep current" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info & Actions */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 shadow">{error}</div>}
          {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 shadow">{success}</div>}
          
          {/* Digital ID Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border-t-8 border-primary relative">
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">DIGITAL PASS</div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-2xl font-black shadow-inner">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                  <p className="text-sm font-mono text-gray-500">ID: {user.studentId}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Assigned Route</div>
              <div className="text-4xl font-extrabold text-primary mb-3">BUS {user.busNo}</div>
              
              <div className="space-y-2 mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-gray-700 flex items-center gap-2"><FiMapPin className="text-secondary" /> <b>Pickup:</b> {user.pickupLocation}</p>
                <p className="text-gray-700 flex items-center gap-2"><FiCheckCircle className="text-secondary" /> <b>Route:</b> {bus?.route || 'N/A'}</p>
                <p className="text-gray-700 flex items-center gap-2"><FiPhoneCall className="text-secondary" /> <b>Driver:</b> {bus?.driverName || 'Unassigned'} ({bus?.driverPhone || 'N/A'})</p>
              </div>
            </div>
          </div>

          {/* Real-time Arrival */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl shadow-md text-white">
            <h2 className="text-sm font-medium opacity-80 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FiClock /> Live Route Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4 border-b border-blue-500/50 pb-4 mb-4">
              <div>
                <p className="text-xs text-blue-200">Pickup in</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black">{arrival?.estimatedArrival || 0}</span>
                  <span className="text-sm opacity-90 mb-1">mins</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-blue-200">Campus Arrival</p>
                <div className="text-2xl font-bold mt-1">{arrival?.dropoffTime || '08:30 AM'}</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm bg-blue-900/30 p-3 rounded-lg">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                At: {arrival?.currentLocation || 'Garage'}
              </span>
              <span className={`font-bold px-2 py-1 rounded text-xs ${
                arrival?.trafficStatus === 'Heavy' ? 'bg-red-500' 
                : arrival?.trafficStatus === 'Moderate' ? 'bg-orange-500' 
                : 'bg-green-500'
              }`}>
                Traffic: {arrival?.trafficStatus || 'Light'}
              </span>
            </div>
            <p className="text-blue-200 text-xs mt-3 flex items-center gap-1 justify-center"><FiCloud /> Weather is clear at destination</p>
          </div>

          {/* Quick Attendance */}
          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Live Attendance ({today})</h2>
            
            {todayAttendance ? (
              <div className="bg-gray-50 p-4 rounded-lg border text-center">
                <p className="text-gray-600 text-sm mb-2">Your attendance for today is marked as:</p>
                <span className={`inline-block px-5 py-2 rounded-full font-black text-white shadow-sm text-lg ${
                  todayAttendance.status === 'present' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {todayAttendance.status === 'present' ? 'PRESENT (Entered Bus)' : 'ABSENT (Did Not Enter)'}
                </span>
                
                {todayAttendance.status === 'absent' && (
                  <p className="text-sm text-red-600 mt-3 font-bold">⚠️ Your parent has been notified of your absence.</p>
                )}
                
                <div className="mt-4 border-t pt-4">
                  <button onClick={() => {
                    if(window.confirm("Are you sure you want to change your attendance status?")) {
                      api.post('/student/attendance', { status: todayAttendance.status === 'present' ? 'absent' : 'present', date: today }).then(() => {
                        alert("Status updated!");
                        fetchData();
                      });
                    }
                  }} className="text-xs text-blue-600 font-bold underline hover:text-blue-800">
                    Change my status to {todayAttendance.status === 'present' ? 'ABSENT' : 'PRESENT'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-gray-600 text-sm mb-1">Please confirm your status when you reach the bus:</p>
                <button onClick={() => handleAttendance('present')} className="w-full flex justify-center items-center gap-2 bg-green-600 text-white font-black text-lg px-6 py-5 rounded-xl shadow-md hover:bg-green-700 transition active:scale-95 border-b-4 border-green-800">
                  <FiCheckCircle size={24} /> ENTER BUS
                </button>
                <button onClick={() => handleAttendance('absent')} className="w-full flex justify-center items-center gap-2 bg-red-100 text-red-700 font-bold px-4 py-4 rounded-xl shadow-sm hover:bg-red-200 transition">
                  <FiXCircle size={20} /> I WILL NOT ENTER (Absent)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Map & Alerts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Live Map Tracking */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200" style={{ height: '400px' }}>
            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Marker position={position} icon={busIcon}>
                <Popup>
                  <b>Bus {bus?.busNo}</b><br/>
                  Current Location: {bus?.currentLocation}
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Smart Notifications */}
          <div className="bg-white p-6 rounded-xl shadow-md flex-1">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><FiBell /> Notifications Center</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{notifications.filter(n => !n.read).length} New</span>
              )}
            </h2>
            
            {notifications.length === 0 ? (
              <div className="text-center text-gray-400 py-6">
                <FiBell size={40} className="mx-auto mb-2 opacity-20" />
                <p>No new alerts at the moment.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {notifications.map(n => (
                  <div key={n._id} className={`p-4 rounded-lg border-l-4 shadow-sm transition ${n.read ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-500'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-bold text-sm ${n.type === 'arrival' ? 'text-blue-700' : n.type === 'sos' ? 'text-red-600' : 'text-gray-800'}`}>
                        {n.type === 'arrival' ? '🚌 Live Update' : n.type === 'sos' ? '🚨 EMERGENCY' : '🔔 Alert'}
                      </span>
                      {!n.read && <button onClick={() => markRead(n._id)} className="text-xs text-blue-600 hover:underline">Mark as read</button>}
                    </div>
                    <p className="text-gray-700 text-sm">{n.message}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}