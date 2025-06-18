import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { db } from "../firebase";
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(
          collection(db, "events"),
          where("status", "==", "approved"),
          orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const categories = [
    { id: "all", name: "All Events", icon: "🎯" },
    { id: "tech", name: "Technology", icon: "💻" },
    { id: "cultural", name: "Cultural", icon: "🎭" },
    { id: "sports", name: "Sports", icon: "⚽" },
    { id: "academic", name: "Academic", icon: "📚" },
    { id: "workshop", name: "Workshop", icon: "🛠️" }
  ];

  const filteredEvents = filter === "all" 
    ? events 
    : events.filter(event => event.category === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900">
      {/* Updated Navbar */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/events" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">CampusMeet</span>
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center space-x-4">

              <Link to="/host-event"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2"
                          >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-white">Host Event</span>
                          </Link>

                          {/* Notifications */}
                                  <button className="relative p-2 text-white hover:bg-white/10 rounded-xl transition-colors">
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                  </svg>
                                  </button>

                                  {/* Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-3 p-2 text-white hover:bg-white/10 rounded-xl transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                    {currentUser?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm text-white truncate">{currentUser?.email}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                    Profile Settings
                  </Link>
                  <button 
                    onClick={handleSignOut} 
                    className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10">
        

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-4 scrollbar-hide">
            {categories.map(category => (
                <button
                    key={category.id}
                    onClick={() => setFilter(category.id)}
                    className={`flex items-center px-6 py-3 rounded-xl whitespace-nowrap transition-all text-white ${
                        filter === category.id
                            ? "bg-blue-600"
                            : "bg-white/10 hover:bg-white/20"
                    }`}
                >
                    <span className="mr-2 text-white">{category.icon}</span>
                    <span className="text-white">{category.name}</span>
                </button>
            ))}
        </div>

        {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Event Header */}
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                  <p className="text-white/80 mb-4">{event.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {event.tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-white/10 text-white rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center text-white/80 text-sm">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {new Date(event.date?.toDate?.() || event.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Event Footer */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">{event.location}</span>
                    <Link
                      to={`/events/${event.id}`}
                      className="text-white hover:text-blue-300 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
                <p className="text-white/80">
                  No events match your current filters.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
