import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from "react-router-dom";

const OrganizerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch organizer's events or other relevant data
    // This is a placeholder for actual data fetching logic
    const fetchEvents = async () => {
      try {
        // Replace with actual API call or Firebase query
        // const eventData = await fetchOrganizerEvents(currentUser.uid);
        // setEvents(eventData);
        
        // Placeholder data
        setEvents([
          { id: 1, name: 'Campus Tech Fair', date: '2023-08-15', status: 'upcoming' },
          { id: 2, name: 'Career Expo', date: '2023-09-20', status: 'planning' },
          { id: 3, name: 'Hackathon 2023', date: '2023-10-05', status: 'registration-open' }
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentUser]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{currentUser?.email}</span>
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h2 className="text-xl font-semibold mb-4">Welcome to your Organizer Dashboard!</h2>
            <p>Here you can create and manage campus events.</p>
            
            <div className="mt-6">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Create New Event
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium">Your Events</h3>
              <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {events.length > 0 ? (
                    events.map(event => (
                      <li key={event.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {event.name}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                10 Registrations
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                Event Date: {new Date(event.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p>No events found. Create your first event to get started!</p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizerDashboard;
