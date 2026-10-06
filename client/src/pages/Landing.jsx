import { Link } from 'react-router-dom';
import { FiMap, FiShield, FiClock, FiSmartphone } from 'react-icons/fi';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-primary text-white p-4 md:px-8 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-black tracking-wide flex items-center gap-2">
          <FiMap size={28} /> Campus Glide
        </h1>
        <Link to="/login" className="bg-white text-primary font-bold px-6 py-2 rounded-full shadow hover:bg-gray-100 transition">
          Login Portal
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-12">
        <div className="max-w-4xl">
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Next-Gen College <br/><span className="text-primary">Transport System</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Real-time GPS bus tracking, instant smart attendance, emergency SOS alerts, and automated parent notifications — all in one modern platform.
          </p>
          <Link to="/login" className="inline-block bg-primary text-white text-xl font-bold px-10 py-4 rounded-full shadow-lg hover:bg-blue-800 hover:scale-105 transition-all">
            Get Started Now
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <FiMap className="text-blue-500 mb-4" size={40} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Live Tracking</h3>
            <p className="text-gray-600 text-sm">Monitor all college buses in real-time with simulated traffic conditions and precise ETA predictions.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <FiShield className="text-green-500 mb-4" size={40} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Smart Safety</h3>
            <p className="text-gray-600 text-sm">Instantly notify parents of absences and trigger immediate SOS alerts directly to the administration.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <FiClock className="text-orange-500 mb-4" size={40} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Instant Attendance</h3>
            <p className="text-gray-600 text-sm">One-click digital check-ins replace outdated manual logs, saving time and keeping exact records.</p>
          </div>
        </div>
      </main>
      
      <footer className="text-center p-6 text-gray-500 text-sm border-t bg-white">
        &copy; 2026 Campus Glide Tracker.
      </footer>
    </div>
  );
}
