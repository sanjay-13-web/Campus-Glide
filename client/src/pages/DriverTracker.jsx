import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FiMapPin, FiTruck, FiCheckCircle } from 'react-icons/fi';

export default function DriverTracker() {
  const { busNo } = useParams();
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let watchId;
    if (tracking) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });
            try {
              // Send live GPS to backend
              await axios.put(`/api/bus/${busNo}/location`, { lat: latitude, lng: longitude });
            } catch (err) {
              console.error('Failed to sync location');
            }
          },
          (err) => setError(err.message),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      } else {
        setError('GPS not supported on this device');
      }
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [tracking, busNo]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiTruck size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-2">BUS {busNo}</h1>
        <p className="text-gray-500 mb-8">Driver Tracking Terminal</p>

        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        {!tracking ? (
          <button 
            onClick={() => setTracking(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition text-xl flex justify-center items-center gap-2"
          >
            <FiMapPin /> START TRIP & TRACKING
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200">
              <FiCheckCircle size={30} className="mx-auto mb-2" />
              <p className="font-bold">Tracking Active</p>
              <p className="text-sm opacity-80 mt-1">Live location is being shared with students.</p>
            </div>
            
            {location && (
              <p className="text-xs text-gray-400 font-mono">
                GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            )}

            <button 
              onClick={() => setTracking(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow transition"
            >
              END TRIP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
