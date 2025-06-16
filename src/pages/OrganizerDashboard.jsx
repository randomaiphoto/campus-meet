import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase'; // Import db
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore'; // Import Firestore functions
import { Link } from "react-router-dom";

const OrganizerDashboard = () => {
  const { currentUser, logout } = useAuth();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState(''); // Comma-separated tags
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Organizer's events state
  const [myEvents, setMyEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Fetch events created by the current organizer
  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      setLoadingEvents(false);
      return;
    }

    const fetchOrganizerEvents = async () => {
      setLoadingEvents(true);
      try {
        const eventsRef = collection(db, "events");
        const q = query(
          eventsRef,
          where("createdBy", "==", currentUser.uid),
          orderBy("createdAt", "desc") // Show newest first
        );
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyEvents(eventsData);
      } catch (error) {
        console.error("Error fetching organizer events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchOrganizerEvents();
  }, [currentUser]);

  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title || !description || !date || !time || !location) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time into a single JS Date object
      const eventDateTime = new Date(`${date}T${time}`);
      if (isNaN(eventDateTime.getTime())) {
        setFormError('Invalid date or time format.');
        setIsSubmitting(false);
        return;
      }

      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      const newEvent = {
        title,
        description,
        eventDate: eventDateTime, // Store as JS Date, Firestore will convert to Timestamp
        location,
        tags: tagsArray,
        createdBy: currentUser.uid,
        organizerName: currentUser.name || currentUser.displayName || currentUser.email, // Use name from Firestore user profile
        status: "pending", // Default status
        createdAt: serverTimestamp(),
        attendees: [], // Initialize attendees
        attendeeCount: 0, // Initialize attendee count
      };

      const docRef = await addDoc(collection(db, "events"), newEvent);
      setFormSuccess(`Event "${title}" created successfully! It is pending approval.`);

      // Add to local state to update UI immediately
      setMyEvents(prevEvents => [{ id: docRef.id, ...newEvent, createdAt: new Date() }, ...prevEvents]);

      // Clear form
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      setTags('');
      setShowForm(false);

    } catch (error) {
      console.error("Error creating event:", error);
      setFormError('Failed to create event. Please try again. ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForDisplay = (firestoreTimestamp) => {
    if (!firestoreTimestamp) return 'N/A';
    // Check if it's already a Date object (e.g., from optimistic update) or a Firestore Timestamp
    const dateObj = firestoreTimestamp.toDate ? firestoreTimestamp.toDate() : firestoreTimestamp;
    return dateObj.toLocaleString();
 };


  if (!currentUser) {
    return <div className="text-center p-8">Loading user information...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-700">Organizer Dashboard</h1>
          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            <span className="text-sm text-gray-600 hidden md:block">{currentUser?.name || currentUser?.email}</span>
            <Link to="/student" className="text-sm text-indigo-600 hover:text-indigo-800">View as Student</Link>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Manage Your Events</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
            >
              {showForm ? 'Cancel' : '+ Create New Event'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Event Details</h3>
              {formError && <p className="text-red-500 text-sm bg-red-100 p-2 rounded mb-3">{formError}</p>}
              {formSuccess && <p className="text-green-500 text-sm bg-green-100 p-2 rounded mb-3">{formSuccess}</p>}
              <form onSubmit={handleCreateEventSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                  <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time</label>
                    <input type="time" id="time" value={time} onChange={(e) => setTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                  <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                  <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </form>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <h3 className="text-md font-semibold text-gray-700 p-4 border-b">Your Submitted Events</h3>
            {loadingEvents && <p className="p-4 text-sm text-gray-500">Loading your events...</p>}
            {!loadingEvents && myEvents.length === 0 && (
              <p className="p-4 text-sm text-gray-500">You haven't created any events yet. Click "+ Create New Event" to get started!</p>
            )}
            {!loadingEvents && myEvents.length > 0 && (
              <ul className="divide-y divide-gray-200">
                {myEvents.map(event => (
                  <li key={event.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">{event.title}</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            event.status === 'approved' ? 'bg-green-100 text-green-800' :
                            event.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800' // pending
                          }`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-xs text-gray-500">
                            Date: {formatDateForDisplay(event.eventDate)}
                          </p>
                          <p className="mt-1 flex items-center text-xs text-gray-500 sm:mt-0 sm:ml-4">
                            Location: {event.location}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-gray-500 sm:mt-0">
                           Created: {formatDateForDisplay(event.createdAt)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizerDashboard;
