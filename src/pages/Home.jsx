import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { db } from "../firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popularEvents, setPopularEvents] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch events and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesData = [
          { id: "academic", name: "Academic", icon: "🎓", color: "bg-blue-100 text-blue-800" },
          { id: "social", name: "Social", icon: "🎉", color: "bg-purple-100 text-purple-800" },
          { id: "tech", name: "Technology", icon: "💻", color: "bg-indigo-100 text-indigo-800" },
          { id: "sports", name: "Sports", icon: "⚽", color: "bg-green-100 text-green-800" },
          { id: "career", name: "Career", icon: "💼", color: "bg-orange-100 text-orange-800" },
          { id: "arts", name: "Arts & Culture", icon: "🎨", color: "bg-pink-100 text-pink-800" },
        ];
        setCategories(categoriesData);
        
        // Featured events - events with "featured" flag
        const featuredQuery = query(
          collection(db, "events"), 
          where("status", "==", "approved"),
          where("featured", "==", true),
          orderBy("date", "asc"),
          limit(3)
        );
        
        // Upcoming events - next 6 events by date
        const upcomingQuery = query(
          collection(db, "events"),
          where("status", "==", "approved"),
          where("date", ">=", new Date()),
          orderBy("date", "asc"),
          limit(6)
        );
        
        // Popular events - events with most attendees
        const popularQuery = query(
          collection(db, "events"),
          where("status", "==", "approved"),
          orderBy("attendeeCount", "desc"),
          limit(3)
        );
        
        // Gallery - recent media uploads
        const galleryQuery = query(
          collection(db, "media"),
          orderBy("timestamp", "desc"),
          limit(8)
        );
        
        // Execute queries
        const [featuredSnap, upcomingSnap, popularSnap, gallerySnap] = await Promise.all([
          getDocs(featuredQuery),
          getDocs(upcomingQuery),
          getDocs(popularQuery),
          getDocs(galleryQuery)
        ]);
        
        // Process results
        setFeaturedEvents(featuredSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setUpcomingEvents(upcomingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setPopularEvents(popularSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setGallery(gallerySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching home page data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-indigo-700 flex items-center">
            CampusMeet<span className="text-indigo-500 ml-1">🎓</span>
          </Link>
          
          <div className="flex-1 max-w-lg mx-6 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search events, clubs or interests..."
                className="w-full py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
          
          <div className="flex space-x-4 items-center">
            {currentUser ? (
              <>
                <Link to={`/${currentUser.role || 'student'}`} className="text-sm text-indigo-700 hover:text-indigo-900">
                  Dashboard
                </Link>
                <Link to="/new-event" className="hidden sm:block text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition">
                  Create Event
                </Link>
                <div className="relative group">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm cursor-pointer">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block">
                    <div className="px-4 py-2 text-xs text-gray-500">{currentUser.email}</div>
                    <hr />
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                    <Link to="/saved-events" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Saved Events</Link>
                    <button onClick={() => navigate("/logout")} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-indigo-600">
                  Log in
                </Link>
                <Link to="/register" className="text-sm px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <img 
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" 
              alt="Campus background" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Discover campus events & connections
              </h1>
              <p className="text-lg md:text-xl text-indigo-100 mb-6">
                Join groups, attend events, share memories, and create moments that last beyond graduation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/events" 
                  className="px-6 py-3 bg-white text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 transition text-center"
                >
                  Explore Events
                </Link>
                <Link 
                  to="/register" 
                  className="px-6 py-3 bg-indigo-800 bg-opacity-50 text-white font-medium rounded-lg hover:bg-opacity-70 backdrop-blur-sm transition text-center"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="container mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Browse by category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(category => (
              <Link 
                key={category.id} 
                to={`/category/${category.id}`}
                className={`${category.color} rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition group`}
              >
                <span className="text-3xl mb-2">{category.icon}</span>
                <h3 className="font-medium group-hover:text-indigo-700">{category.name}</h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredEvents.map(event => (
                <Link 
                  key={event.id} 
                  to={`/events/${event.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow relative group flex flex-col h-full"
                >
                  {/* Event image */}
                  <div className="h-40 bg-indigo-100 relative">
                    {event.imageUrl ? (
                      <img 
                        src={event.imageUrl} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-400">
                        <span className="text-white text-4xl">{event.title?.charAt(0) || '📅'}</span>
                      </div>
                    )}
                    <div className="absolute top-0 left-0 m-3">
                      <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs rounded-full">
                        Featured
                      </span>
                    </div>
                  </div>

                  {/* Event details */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-xs text-indigo-600 font-medium mb-1">
                      {formatDate(event.date)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 flex-grow line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.location}</span>
                      </div>
                      <span className="text-sm bg-gray-100 text-gray-800 py-1 px-2 rounded-full">
                        {event.attendeeCount || 0} attendees
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link 
                to="/featured-events"
                className="inline-block px-5 py-2.5 text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
              >
                See all featured events →
              </Link>
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Upcoming Events</h2>
            <Link 
              to="/events"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl shadow p-5 animate-pulse">
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <Link 
                    key={event.id} 
                    to={`/events/${event.id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
                  >
                    {/* Event image */}
                    <div className="h-32 bg-gray-100 relative">
                      {event.imageUrl ? (
                        <img 
                          src={event.imageUrl} 
                          alt={event.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                          <span className="text-indigo-500 text-4xl">{event.title?.charAt(0) || '📅'}</span>
                        </div>
                      )}
                    </div>

                    {/* Event details */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="text-xs text-indigo-600 font-medium mb-1">
                        {formatDate(event.date)}
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2 line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-grow">
                        {event.description}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {event.tags?.slice(0, 3).map((tag, idx) => (
                          <span 
                            key={idx}
                            className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                        {(event.tags?.length || 0) > 3 && (
                          <span className="text-xs text-gray-500">+{event.tags.length - 3} more</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span>{event.organizedBy || 'Campus Club'}</span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-800 py-1 px-2 rounded-full">
                          {event.attendeeCount || 0} attendees
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-3 py-12 text-center">
                  <p className="text-gray-500">No upcoming events at this time. Check back soon!</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Campus Gallery */}
        <section className="bg-gray-100 py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Campus Life Gallery</h2>
              <Link 
                to="/gallery"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {gallery.map((item, index) => (
                <div 
                  key={item.id}
                  className={`group relative overflow-hidden rounded-lg ${
                    index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                  } aspect-square`}
                >
                  <img 
                    src={item.fileUrl} 
                    alt={item.caption || "Gallery image"} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    {item.caption && (
                      <p className="text-white text-sm font-medium line-clamp-3">{item.caption}</p>
                    )}
                    <div className="flex items-center mt-1">
                      <span className="text-white/80 text-xs">
                        By {item.uploader || 'Campus Member'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Events */}
        {popularEvents.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Popular Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {popularEvents.map(event => (
                <Link 
                  key={event.id} 
                  to={`/events/${event.id}`}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex"
                >
                  {/* Event image */}
                  <div className="w-1/3 bg-gray-100 relative">
                    {event.imageUrl ? (
                      <img 
                        src={event.imageUrl} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                        <span className="text-indigo-500 text-3xl">{event.title?.charAt(0) || '📅'}</span>
                      </div>
                    )}
                  </div>

                  {/* Event details */}
                  <div className="p-4 w-2/3">
                    <div className="text-xs text-indigo-600 font-medium mb-1">
                      {formatDate(event.date)}
                    </div>
                    <h3 className="text-base font-medium text-gray-800 mb-1 line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {event.description}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="bg-indigo-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to create your own campus event?</h2>
            <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
              Start organizing campus events, build communities, and create lasting memories with fellow students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="px-8 py-3 bg-white text-indigo-700 font-medium rounded-lg hover:bg-indigo-50 transition"
              >
                Get Started
              </Link>
              <Link 
                to="/how-it-works" 
                className="px-8 py-3 bg-indigo-800 bg-opacity-50 text-white font-medium rounded-lg hover:bg-opacity-70 transition"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">CampusMeet</h3>
              <p className="text-gray-300 text-sm">
                Connecting students through events, workshops, and shared experiences on campus.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/events" className="hover:text-white">All Events</Link></li>
                <li><Link to="/gallery" className="hover:text-white">Media Gallery</Link></li>
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <ul className="flex space-x-4">
                <li><a href="#" className="text-gray-300 hover:text-white text-xl">📱</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-xl">📸</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-xl">🐦</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-xl">👍</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} CampusMeet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
