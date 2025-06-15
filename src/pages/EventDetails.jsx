import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function EventDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const eventDoc = await getDoc(doc(db, "events", id));
        
        if (eventDoc.exists()) {
          const eventData = { id: eventDoc.id, ...eventDoc.data() };
          setEvent(eventData);
          
          // Fetch organizer details
          const organizerDoc = await getDoc(doc(db, "users", eventData.createdBy));
          if (organizerDoc.exists()) {
            setOrganizer(organizerDoc.data());
          }
          
          // Fetch event media
          const mediaQuery = query(
            collection(db, "media"),
            where("eventId", "==", id)
          );
          const mediaSnap = await getDocs(mediaQuery);
          const mediaData = [];
          
          mediaSnap.forEach((doc) => {
            mediaData.push({ id: doc.id, ...doc.data() });
          });
          
          setMedia(mediaData);
        } else {
          setError("Event not found");
        }
      } catch (err) {
        setError("Error fetching event details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  const addToCalendar = (event) => {
    // In a real implementation, you would generate an .ics file here
    alert(`Added "${event.title}" to calendar! (This is a mock function)`);
  };

  const shareEvent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out this campus event: ${event.title}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 bg-indigo-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-indigo-100 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl text-red-500 mb-4">{error}</h2>
        <Link to="/student" className="text-indigo-600 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link to="/student" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Events
        </Link>

        {/* Event header */}
        <div 
          className="h-64 md:h-80 rounded-2xl overflow-hidden bg-indigo-600 relative mb-8"
          style={{
            backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : '',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-8">
            <div className="flex flex-wrap gap-2 mb-2">
              {event.tags?.map((tag, idx) => (
                <span 
                  key={idx}
                  className="text-xs bg-white/20 backdrop-blur-sm text-white rounded-full px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
            
            <div className="flex items-center text-white/80 text-sm">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(event.date?.toDate?.() || event.date).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button 
              onClick={() => addToCalendar(event)}
              className="p-2 bg-white/30 backdrop-blur-sm hover:bg-white/50 rounded-full text-white transition"
              title="Add to calendar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            <button 
              onClick={shareEvent}
              className="p-2 bg-white/30 backdrop-blur-sm hover:bg-white/50 rounded-full text-white transition"
              title="Share event"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-white/30">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">About this event</h2>
              <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
            </div>

            {/* Location */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-white/30">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Location</h2>
              
              <div className="flex items-start">
                <svg className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-gray-800 font-medium">{event.location}</p>
                  {event.address && <p className="text-gray-500 text-sm">{event.address}</p>}
                </div>
              </div>
              
              {/* Map placeholder - would be a Google Map embed in production */}
              <div className="mt-4 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                Map would be embedded here
              </div>
            </div>

            {/* Media Gallery */}
            {media.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-white/30">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Gallery</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {media.map((item) => (
                    <div 
                      key={item.id}
                      className="group relative overflow-hidden rounded-lg aspect-square"
                    >
                      <img 
                        src={item.fileUrl} 
                        alt={item.caption || "Event media"} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        {item.caption && <p className="text-white text-xs font-medium line-clamp-2">{item.caption}</p>}
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
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer info */}
            {organizer && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-white/30">
                <h3 className="font-medium text-gray-800 mb-4">Organized by</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold mr-3">
                    {organizer.name?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{organizer.name}</h4>
                    <p className="text-gray-500 text-xs">{organizer.role}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-white/30">
              <h3 className="font-medium text-gray-800 mb-4">Quick actions</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={() => addToCalendar(event)}
                  className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add to Calendar
                </button>
                
                <button 
                  onClick={shareEvent}
                  className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Event
                </button>
              </div>
            </div>

            {/* Related events */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-white/30">
              <h3 className="font-medium text-gray-800 mb-4">You might also like</h3>
              <p className="text-xs text-gray-500">Coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
