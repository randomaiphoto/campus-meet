import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/Authcontext';

const OrganizerDashboard = () => {
  const { currentUser } = useAuth();
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
    <div className="organizer-dashboard">
      <h1>Organizer Dashboard</h1>
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Events</h3>
          <p>{events.length}</p>
        </div>
        <div className="summary-card">
          <h3>Upcoming Events</h3>
          <p>{events.filter(event => event.status === 'upcoming').length}</p>
        </div>
        <div className="summary-card">
          <h3>In Planning</h3>
          <p>{events.filter(event => event.status === 'planning').length}</p>
        </div>
      </div>

      <div className="events-section">
        <h2>Your Events</h2>
        <button className="create-event-btn">Create New Event</button>
        
        <div className="events-list">
          {events.length > 0 ? (
            events.map(event => (
              <div key={event.id} className="event-card">
                <h3>{event.name}</h3>
                <p>Date: {event.date}</p>
                <p>Status: {event.status}</p>
                <div className="event-actions">
                  <button>Edit</button>
                  <button>Manage</button>
                </div>
              </div>
            ))
          ) : (
            <p>No events found. Create your first event to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
