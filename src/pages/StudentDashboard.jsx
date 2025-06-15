import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";

export default function StudentDashboard() {
  const { currentUser, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [media, setMedia] = useState([]);
  const [eventNames, setEventNames] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch approved events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(
          collection(db, "events"), 
          where("status", "==", "approved"),
          orderBy("date", "asc")
        );
        const querySnapshot = await getDocs(q);
        const eventsData = [];
        querySnapshot.forEach((doc) => {
          eventsData.push({ id: doc.id, ...doc.data() });
        });
        setEvents(eventsData);
        
        // Set featured events (first 3)
        setFeaturedEvents(eventsData.slice(0, 3));
      } catch (error) {
        console.error("Error fetching events: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch media gallery
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const mediaCollection = collection(db, "media");
        const mediaSnapshot = await getDocs(mediaCollection);
        const mediaData = [];
        const eventSet = new Set();
        
        mediaSnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          mediaData.push(data);
          if (data.eventId) eventSet.add(data.eventId);
        });
        
        setMedia(mediaData);
        
        // Get event names for filter
        const eventIds = Array.from(eventSet);
        const eventNamesArray = [];
        
        for (const eventId of eventIds) {
          try {
            const eventRef = query(collection(db, "events"), where("id", "==", eventId));
            const eventSnap = await getDocs(eventRef);
            if (!eventSnap.empty) {
              eventNamesArray.push({
                id: eventId,
                title: eventSnap.docs[0].data().title
              });
            }
          } catch (err) {
            console.error("Error fetching event name: ", err);
          }
        }
        
        setEventNames(eventNamesArray);
      } catch (error) {
        console.error("Error fetching media: ", error);
      }
    };

    fetchMedia();
  }, []);

  // Check if organizer request exists
  useEffect(() => {
    const checkOrganizerRequest = async () => {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, "organizer_requests"), 
          where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setRequestSent(true);
          setRequestStatus(querySnapshot.docs[0].data().status);
        }
      } catch (error) {
        console.error("Error checking organizer request: ", error);
      }
    };
    
    checkOrganizerRequest();
  }, [currentUser]);

  // Filter events by category
  const filteredEvents = categoryFilter === "all" 
    ? events 
    : events.filter(event => event.tags?.includes(categoryFilter));

  // Filter media by selected event
  const filteredMedia = selectedEvent === "all" 
    ? media 
    : media.filter(item => item.eventId === selectedEvent);

  // Add to Calendar function (mock)
  const addToCalendar = (event) => {
    alert(`Added ${event.title} to calendar! (This is a mock function)`);
    // In a real implementation, you'd generate an .ics file here
  };

  // Share media function using Web Share API
  const shareMedia = async (media) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: media.caption || 'Check out this photo!',
          text: `Check out this photo from ${media.eventName || 'our event'}!`,
          url: media.fileUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Web Share API not supported on this browser. The link has been copied to clipboard instead.');
      navigator.clipboard.writeText(media.fileUrl);
    }
  };

  // Submit organizer request
  const requestOrganizerRole = async () => {
    try {
      await addDoc(collection(db, "organizer_requests"), {
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userEmail: currentUser.email,
        status: "pending",
        timestamp: serverTimestamp()
      });
      setRequestSent(true);
      setRequestStatus("pending");
      alert("Your request to become an organizer has been submitted!");
    } catch (error) {
      console.error("Error submitting request: ", error);
      alert("Failed to submit request. Please try again later.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="p-4 max-w-md mx-auto">
          <div className="animate-pulse flex flex-col items-center space-y-6">
            <div className="rounded-full bg-indigo-200 h-20 w-20"></div>
            <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
            <div className="h-4 bg-indigo-200 rounded w-1/2"></div>
            <div className="h-4 bg-indigo-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-indigo-700">CampusMeet</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/saved-events" className="text-gray-600 hover:text-indigo-700 text-sm">
              <svg className="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Saved
            </Link>
            
            <div className="relative group">
              <div className="flex items-center cursor-pointer">
                <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {currentUser?.displayName?.charAt(0) || 'S'}
                </span>
              </div>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block">
                <div className="px-4 py-2 text-xs text-gray-500">{currentUser?.email}</div>
                <hr />
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-10 mb-10 text-white overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 backdrop-blur-xl"></div>
          <div className="absolute left-0 bottom-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 backdrop-blur-xl"></div>
          
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-2xl md:text-4xl font-bold mb-4">Discover Campus Events</h1>
            <p className="text-white/80 text-sm md:text-base mb-6">Connect with fellow students, join activities, and make the most of your campus experience.</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setCategoryFilter("academic")} className={`px-4 py-2 rounded-full text-xs md:text-sm transition ${categoryFilter === "academic" ? "bg-white text-indigo-700" : "bg-white/20 text-white hover:bg-white/30"}`}>Academic</button>
              <button onClick={() => setCategoryFilter("social")} className={`px-4 py-2 rounded-full text-xs md:text-sm transition ${categoryFilter === "social" ? "bg-white text-indigo-700" : "bg-white/20 text-white hover:bg-white/30"}`}>Social</button>
              <button onClick={() => setCategoryFilter("tech")} className={`px-4 py-2 rounded-full text-xs md:text-sm transition ${categoryFilter === "tech" ? "bg-white text-indigo-700" : "bg-white/20 text-white hover:bg-white/30"}`}>Tech</button>
              <button onClick={() => setCategoryFilter("sports")} className={`px-4 py-2 rounded-full text-xs md:text-sm transition ${categoryFilter === "sports" ? "bg-white text-indigo-700" : "bg-white/20 text-white hover:bg-white/30"}`}>Sports</button>
              <button onClick={() => setCategoryFilter("career")} className={`px-4 py-2 rounded-full text-xs md:text-sm transition ${categoryFilter === "career" ? "bg-white text-indigo-700" : "bg-white/20 text-white hover:bg-white/30"}`}>Career</button>
              <button onClick={() => setCategoryFilter("all")} className={`px-4 py-2 rounded-full text-xs md:text-sm transition ${categoryFilter === "all" ? "bg-white text-indigo-700" : "bg-white/20 text-white hover:bg-white/30"}`}>All Events</button>
            </div>
          </div>
        </div>

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-5">Featured Events</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <div 
                  key={event.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div 
                    className="h-40 bg-gradient-to-r from-indigo-500 to-purple-500 relative"
                    style={{
                      backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : '',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
                      <span className="text-xs font-medium px-2 py-1 bg-indigo-600 rounded-full">Featured</span>
                      <h3 className="text-lg font-semibold mt-1">{event.title}</h3>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-2">
                      {new Date(event.date?.toDate?.() || event.date).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </div>
                      <Link 
                        to={`/events/${event.id}`} 
                        className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Events */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              {categoryFilter !== "all" 
                ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Events` 
                : "Upcoming Events"}
            </h2>
            
            <div className="flex items-center">
              <select 
                onChange={(e) => setCategoryFilter(e.target.value)}
                value={categoryFilter}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                <option value="academic">Academic</option>
                <option value="social">Social</option>
                <option value="tech">Tech</option>
                <option value="sports">Sports</option>
                <option value="career">Career</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="bg-white rounded-xl shadow p-4 animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      <div 
                        className="h-40 bg-gradient-to-r from-indigo-500 to-purple-500 relative"
                        style={{
                          backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : '',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="absolute top-0 right-0 p-2">
                          <button 
                            onClick={() => addToCalendar(event)}
                            className="p-2 bg-white/30 backdrop-blur-sm hover:bg-white/50 rounded-full text-white transition"
                            title="Add to calendar"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {event.tags?.map((tag, idx) => (
                            <span 
                              key={idx}
                              className="text-xs bg-indigo-100 text-indigo-800 rounded-full px-2 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-1">{event.title}</h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {new Date(event.date?.toDate?.() || event.date).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-500">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </div>
                          <Link 
                            to={`/events/${event.id}`} 
                            className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                          >
                            View details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white/50 backdrop-blur-sm rounded-xl">
                  <p className="text-gray-500">No events found in this category. Check back soon!</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Media Gallery */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Media Gallery</h2>
            
            <select 
              value={selectedEvent} 
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Events</option>
              {eventNames.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMedia.length > 0 ? (
              filteredMedia.map((item) => (
                <div 
                  key={item.id}
                  className="group relative overflow-hidden rounded-lg aspect-square"
                >
                  <img 
                    src={item.fileUrl} 
                    alt={item.caption || "Gallery image"} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white text-xs font-medium line-clamp-2">{item.caption}</p>
                    <p className="text-white/80 text-xs mt-1">By {item.uploader}</p>
                    
                    <button
                      onClick={() => shareMedia(item)}
                      className="mt-2 text-xs bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full px-3 py-1 flex items-center w-fit"
                    >
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-xs lg:text-sm">No media found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Organizer Request */}
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 md:mr-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Become an Event Organizer</h3>
              <p className="text-sm text-indigo-800/70">
                Want to create and manage your own campus events? Apply to become an organizer today!
              </p>
            </div>
            
            {!requestSent ? (
              <button
                onClick={requestOrganizerRole}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm shadow-md"
              >
                Apply Now
              </button>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm text-gray-700">
                  Request Status: <span className="font-medium capitalize">{requestStatus}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}