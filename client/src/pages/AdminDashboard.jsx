import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { FiUsers, FiMap, FiCheckSquare, FiLogOut, FiAlertTriangle, FiBell, FiMapPin, FiTruck } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('tracking'); // Default to tracking
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newStudent, setNewStudent] = useState({ name: '', studentId: '', email: '', password: '', busNo: '', parentPhone: '', pickupLocation: '' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling faster for live map (every 10s)
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === 'dashboard') {
      const res = await api.get('/admin/stats');
      setStats(res.data);
      const notifRes = await api.get('/admin/notifications');
      setNotifications(notifRes.data.filter(n => n.recipient === 'admin' || n.type === 'absence' || n.type === 'sos'));
    } else if (activeTab === 'students') {
      const res = await api.get('/admin/students');
      setStudents(res.data);
      const bRes = await api.get('/bus');
      setBuses(bRes.data);
    } else if (activeTab === 'attendance') {
      const res = await api.get('/admin/attendance');
      setAttendance(res.data);
    } else if (activeTab === 'tracking' || activeTab === 'fleet') {
      const bRes = await api.get('/bus');
      setBuses(bRes.data);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
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

  const downloadCSV = () => {
    let csv = "ID,Name,Assigned Bus,Parent Contact\n";
    students.forEach(s => {
      csv += `${s.studentId},${s.name},${s.busNo},${s.parentPhone}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Students_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const sosAlerts = notifications.filter(n => n.type === 'sos');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-primary text-white shadow-xl flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <h2 className="text-2xl font-black tracking-wide">Campus Glide</h2>
          <p className="text-blue-300 text-sm mt-1">Teacher & Admin Portal</p>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <button onClick={() => switchTab('tracking')} className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${activeTab === 'tracking' ? 'bg-blue-800 shadow-inner' : 'hover:bg-blue-800/50'}`}>
            <FiMap /> Live Tracking
          </button>
          <button onClick={() => switchTab('dashboard')} className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${activeTab === 'dashboard' ? 'bg-blue-800 shadow-inner' : 'hover:bg-blue-800/50'}`}>
            <FiBell /> Analytics & Logs
          </button>
          <button onClick={() => switchTab('students')} className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${activeTab === 'students' ? 'bg-blue-800 shadow-inner' : 'hover:bg-blue-800/50'}`}>
            <FiUsers /> Manage Students
          </button>
          <button onClick={() => switchTab('fleet')} className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${activeTab === 'fleet' ? 'bg-blue-800 shadow-inner' : 'hover:bg-blue-800/50'}`}>
            <FiTruck /> Manage Fleet & Drivers
          </button>
          <button onClick={() => switchTab('attendance')} className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${activeTab === 'attendance' ? 'bg-blue-800 shadow-inner' : 'hover:bg-blue-800/50'}`}>
            <FiCheckSquare /> Attendance Logs
          </button>
        </nav>
        
        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
            <div>
              <p className="font-bold text-sm leading-tight">{user.name}</p>
              <p className="text-xs text-blue-300">Administrator</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition font-bold">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* SOS Alerts Banner */}
        {sosAlerts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-red-600 font-black flex items-center gap-2 mb-2 uppercase tracking-wide"><FiAlertTriangle size={24} /> Active Emergencies</h3>
            <div className="flex flex-col gap-2">
              {sosAlerts.map(sos => (
                <div key={sos._id} className="bg-red-100 border-l-4 border-red-600 p-4 rounded shadow-sm flex justify-between items-center animate-pulse">
                  <div>
                    <strong className="text-red-800 block">SOS Triggered</strong>
                    <span className="text-red-700">{sos.message}</span>
                  </div>
                  <span className="text-xs text-red-500 font-bold bg-white px-2 py-1 rounded-full">{new Date(sos.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="animate-fade-in flex flex-col h-full min-h-[600px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-3xl font-extrabold mb-1 text-gray-800 flex items-center gap-2"><FiMap /> Live Fleet Tracking</h2>
                <p className="text-gray-500">Real-time GPS tracking of all active college buses.</p>
              </div>
              
              {/* Quick Bus Lookup */}
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                <span className="font-bold text-gray-700 text-sm whitespace-nowrap">Find Bus:</span>
                <input 
                  type="text" 
                  placeholder="Enter Bus No (e.g. 101)" 
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none w-48"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Display Searched Bus Details if found */}
            {searchQuery && buses.find(b => b.busNo === searchQuery) && (() => {
              const b = buses.find(b => b.busNo === searchQuery);
              return (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-xl shadow-sm mb-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-black text-blue-900 mb-1">BUS {b.busNo} - {b.route}</h3>
                      <p className="text-blue-800 text-sm flex gap-4 items-center">
                        <span><b>Driver:</b> {b.driverName} ({b.driverPhone})</span>
                        <button onClick={() => {
                          const name = prompt("Enter new Driver Name:", b.driverName);
                          if (!name) return;
                          const phone = prompt("Enter new Driver Phone Number:", b.driverPhone);
                          if (!phone) return;
                          api.put(`/admin/bus/${b.busNo}/driver`, { driverName: name, driverPhone: phone })
                            .then(() => { alert('Driver updated!'); fetchData(); })
                            .catch(err => alert('Failed to update driver: ' + err.message));
                        }} className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700 font-bold">Update Driver</button>
                      </p>
                      <p className="text-blue-800 text-sm mt-1"><b>Current Stop:</b> {b.currentLocation}</p>
                    </div>
                    <div className="flex gap-4 items-center mt-3 md:mt-0">
                      <div className="text-center">
                        <p className="text-xs text-blue-700 uppercase font-bold">Seats Available</p>
                        <p className="font-black text-lg">{b.capacity - (b.occupiedSeats || 0)} <span className="text-sm font-normal">/ {b.capacity}</span></p>
                      </div>
                      <div className="text-center ml-2 border-l border-blue-200 pl-4">
                        <p className="text-xs text-blue-700 uppercase font-bold">Campus ETA</p>
                        <p className="font-black text-lg">{b.dropoffTime || '08:30 AM'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-blue-700 uppercase font-bold">Traffic</p>
                        <span className={`px-3 py-1 text-white rounded font-bold text-xs ${
                          b.trafficStatus === 'Heavy' ? 'bg-red-500' : b.trafficStatus === 'Moderate' ? 'bg-orange-500' : 'bg-green-500'
                        }`}>{b.trafficStatus || 'Light'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden relative">
              {buses.length > 0 ? (
                <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  {buses.map(bus => (
                    <Marker key={bus._id} position={[bus.lat || 13.0827, bus.lng || 80.2707]} icon={busIcon}>
                      <Popup>
                        <div className="min-w-[200px]">
                          <b className="text-lg text-primary block mb-2 border-b pb-1">BUS {bus.busNo}</b>
                          <div className="text-sm space-y-1">
                            <p><b>Driver:</b> {bus.driverName} ({bus.driverPhone})</p>
                            <p><b>Route:</b> {bus.route}</p>
                            <p><b>Current Stop:</b> {bus.currentLocation}</p>
                            <p><b>Seats:</b> {bus.capacity - (bus.occupiedSeats || 0)} available</p>
                            <p><b>Campus ETA:</b> {bus.dropoffTime || '08:30 AM'}</p>
                            <p className="flex items-center gap-2 mt-2">
                              <b>Traffic:</b> 
                              <span className={`px-2 py-1 text-white rounded text-xs font-bold ${
                                bus.trafficStatus === 'Heavy' ? 'bg-red-500' : bus.trafficStatus === 'Moderate' ? 'bg-orange-500' : 'bg-green-500'
                              }`}>{bus.trafficStatus || 'Light'}</span>
                            </p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">Loading map...</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && stats && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-extrabold mb-6 text-gray-800">Today's Overview</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-500 font-semibold mb-1">Total Enrolled</div>
                <div className="text-4xl font-black text-primary">{stats.totalStudents}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-500 font-semibold mb-1">Active Buses</div>
                <div className="text-4xl font-black text-primary">{stats.totalBuses}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-t-green-500">
                <div className="text-gray-500 font-semibold mb-1">Boarded Today</div>
                <div className="text-4xl font-black text-green-600">{stats.presentToday}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-t-red-500">
                <div className="text-gray-500 font-semibold mb-1">Absent / Missed</div>
                <div className="text-4xl font-black text-red-600">{stats.absentToday}</div>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4 text-gray-800">System Logs & Parent Notifications</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {notifications.length === 0 ? <p className="p-6 text-gray-500 text-center">No logs yet.</p> : (
                <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {notifications.map(n => (
                    <li key={n._id} className="p-4 hover:bg-gray-50 flex gap-4 items-start">
                      <div className={`mt-1 w-2 h-2 rounded-full ${n.type === 'absence' ? 'bg-orange-500' : n.type === 'sos' ? 'bg-red-600' : 'bg-blue-500'}`}></div>
                      <div>
                        <p className="text-gray-800">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-3xl font-extrabold mb-2 text-gray-800 flex items-center gap-2"><FiTruck /> Manage Fleet & Drivers</h2>
            <p className="text-gray-500 mb-6">Assign and update daily drivers for each bus route.</p>

            {/* Add New Bus Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4 text-primary border-b pb-2">➕ Register New Bus</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const formData = new FormData(e.target);
                  const busData = {
                    busNo: formData.get('busNo'),
                    busName: `Bus ${formData.get('busNo')}`, // Auto-fill required busName
                    route: formData.get('route'),
                    driverName: formData.get('driverName'),
                    driverPhone: formData.get('driverPhone')
                  };
                  await api.post('/bus', busData);
                  alert('Bus added successfully!');
                  e.target.reset();
                  fetchBuses(); // Refresh table
                } catch (err) {
                  alert(err.response?.data?.message || 'Failed to add bus');
                }
              }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Bus Number</label>
                  <input type="text" name="busNo" required placeholder="e.g. 105" className="w-full mt-1 border p-2 rounded focus:ring-2 outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Route Name</label>
                  <input type="text" name="route" required placeholder="e.g. East Campus" className="w-full mt-1 border p-2 rounded focus:ring-2 outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Driver Name</label>
                  <input type="text" name="driverName" required placeholder="e.g. Mike Smith" className="w-full mt-1 border p-2 rounded focus:ring-2 outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Driver Phone</label>
                  <input type="text" name="driverPhone" required placeholder="e.g. 555-0103" className="w-full mt-1 border p-2 rounded focus:ring-2 outline-none bg-gray-50" />
                </div>
                <div className="md:col-span-4 mt-2">
                  <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded-lg transition shadow-sm">
                    Add New Bus to Fleet
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="p-3 text-gray-600 font-semibold">Bus No</th>
                    <th className="p-3 text-gray-600 font-semibold">Route</th>
                    <th className="p-3 text-gray-600 font-semibold">Capacity</th>
                    <th className="p-3 text-gray-600 font-semibold">Current Driver Name</th>
                    <th className="p-3 text-gray-600 font-semibold">Contact Number</th>
                    <th className="p-3 text-gray-600 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map(b => (
                    <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-3 font-black text-primary text-lg">BUS {b.busNo}</td>
                      <td className="p-3 font-medium text-gray-700">{b.route}</td>
                      <td className="p-3 font-bold text-gray-600">{b.capacity} Seats</td>
                      <td className="p-3 text-gray-800 font-medium">{b.driverName || 'Unassigned'}</td>
                      <td className="p-3 text-gray-600">{b.driverPhone || 'N/A'}</td>
                      <td className="p-3">
                        <button onClick={() => {
                          const name = prompt("Enter new Driver Name for Bus " + b.busNo + ":", b.driverName === 'Unassigned' ? '' : b.driverName);
                          if (name === null) return;
                          const phone = prompt("Enter new Driver Phone Number:", b.driverPhone === 'N/A' ? '' : b.driverPhone);
                          if (phone === null) return;
                          api.put(`/admin/bus/${b.busNo}/driver`, { driverName: name || 'Unassigned', driverPhone: phone || 'N/A' })
                            .then(() => { alert('Driver updated successfully!'); fetchData(); })
                            .catch(err => alert('Failed to update driver: ' + err.message));
                        }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition">
                          Change Driver
                        </button>
                        <button onClick={() => {
                          const url = `${window.location.origin}/driver/${b.busNo}`;
                          navigator.clipboard.writeText(url);
                          alert(`Driver Tracking Link copied to clipboard!\n\n${url}\n\nSend this via SMS to the driver!`);
                        }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-green-700 transition ml-2 mt-2 xl:mt-0">
                          Copy SMS Link
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 text-primary border-b pb-2">Register Student to Bus</h3>
              <form onSubmit={handleRegisterStudent} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="text-sm text-gray-600 font-medium">Student Name</label><input type="text" className="w-full mt-1 border-gray-300 bg-gray-50 border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} /></div>
                <div><label className="text-sm text-gray-600 font-medium">ID Number</label><input type="text" className="w-full mt-1 border-gray-300 bg-gray-50 border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none" required value={newStudent.studentId} onChange={e => setNewStudent({...newStudent, studentId: e.target.value})} /></div>
                <div><label className="text-sm text-gray-600 font-medium">Login Email</label><input type="email" className="w-full mt-1 border-gray-300 bg-gray-50 border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none" required value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} /></div>
                <div><label className="text-sm text-gray-600 font-medium">Temporary Password</label><input type="password" className="w-full mt-1 border-gray-300 bg-gray-50 border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none" required value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} /></div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Assign Bus</label>
                  <select className="w-full mt-1 border-gray-300 bg-gray-50 border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none" required value={newStudent.busNo} onChange={e => setNewStudent({...newStudent, busNo: e.target.value})}>
                    <option value="">-- Select Bus --</option>
                    {buses.map(b => <option key={b._id} value={b.busNo}>Bus {b.busNo} ({b.route})</option>)}
                  </select>
                </div>
                <div><label className="text-sm text-gray-600 font-medium">Parent Contact</label><input type="text" className="w-full mt-1 border-gray-300 bg-gray-50 border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none" required value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} /></div>
                <div className="md:col-span-2"><label className="text-sm text-gray-600 font-medium">Designated Stop</label><input type="text" className="w-full mt-1 border-gray-300 bg-gray-50 border p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none" required value={newStudent.pickupLocation} onChange={e => setNewStudent({...newStudent, pickupLocation: e.target.value})} /></div>
                
                <button type="submit" className="md:col-span-2 bg-primary text-white font-bold p-3 rounded-lg mt-2 shadow hover:bg-blue-800 transition">Confirm Registration</button>
              </form>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Enrolled Students Roster</h3>
                <div className="flex gap-3">
                  <input type="text" placeholder="Search by name or ID..." className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <button onClick={downloadCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-green-700">Export CSV</button>
                </div>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="p-3 text-gray-600 font-semibold">ID</th>
                    <th className="p-3 text-gray-600 font-semibold">Student Name</th>
                    <th className="p-3 text-gray-600 font-semibold">Assigned Bus</th>
                    <th className="p-3 text-gray-600 font-semibold">Parent Contact</th>
                    <th className="p-3 text-gray-600 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentId.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                    <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-3 font-mono text-sm">{s.studentId}</td>
                      <td className="p-3 font-medium flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">{s.name.charAt(0)}</div>
                        {s.name}
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-xs">BUS {s.busNo}</span>
                      </td>
                      <td className="p-3 text-gray-600">{s.parentPhone}</td>
                      <td className="p-3"><span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Master Attendance Log</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="p-3 text-gray-600 font-semibold">Date</th>
                  <th className="p-3 text-gray-600 font-semibold">Student ID</th>
                  <th className="p-3 text-gray-600 font-semibold">Bus No</th>
                  <th className="p-3 text-gray-600 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-gray-600">{a.date}</td>
                    <td className="p-3 font-medium font-mono">{a.studentId}</td>
                    <td className="p-3 font-bold text-gray-700">BUS {a.busNo}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm
                        ${(a.status === 'present' || a.status === 'boarded') ? 'bg-green-500' 
                        : a.status === 'missed' ? 'bg-orange-500' 
                        : 'bg-red-500'}`}>
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
}
