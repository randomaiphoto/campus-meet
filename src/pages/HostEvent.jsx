import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, doc, getDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { toast, Toaster } from 'react-hot-toast';

export default function HostEvent() {
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    locations: [],
    category: "",
    registrationLink: "",
    clubName: "",
  });

  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isClubLead, setIsClubLead] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const locations = [
    { id: "lab401", name: "Lab 401" },
    { id: "lab402", name: "Lab 402" },
    { id: "lab503", name: "Lab 503" },
    { id: "seminar", name: "Seminar Hall" }
  ];

  const categories = [
    { id: "academic", name: "Academic", icon: "🎓" },
    { id: "cultural", name: "Cultural", icon: "🎭" },
    { id: "technical", name: "Technical", icon: "💻" },
    { id: "sports", name: "Sports", icon: "⚽" },
    { id: "workshop", name: "Workshop", icon: "🛠️" }
  ];

  useEffect(() => {
    const checkUserRole = async () => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();

        if (!userData?.isClubLead) {
          toast.error("Only club leads can host events");
          navigate("/events");
          return;
        }

        setIsClubLead(true);
        setForm(prev => ({ ...prev, clubName: userData.clubName }));
      } catch (error) {
        console.error("Error checking user role:", error);
        toast.error("Error verifying permissions");
      }
    };

    const fetchAvailableDates = async () => {
      try {
        // Get all existing events
        const eventsQuery = query(collection(db, "events"), where("status", "==", "approved"));
        const eventsSnapshot = await getDocs(eventsQuery);
        const bookedDates = eventsSnapshot.docs.map(doc => doc.data().date);

        // Generate available dates (next 3 months excluding weekends and booked dates)
        const dates = [];
        const today = new Date();
        const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

        for (let d = today; d <= threeMonthsFromNow; d.setDate(d.getDate() + 1)) {
          if (d.getDay() !== 0 && d.getDay() !== 6) { // Exclude weekends
            const dateString = d.toISOString().split('T')[0];
            if (!bookedDates.includes(dateString)) {
              dates.push({
                date: new Date(d),
                isAvailable: true
              });
            }
          }
        }

        setAvailableDates(dates);
      } catch (error) {
        console.error("Error fetching available dates:", error);
      }
    };

    checkUserRole();
    fetchAvailableDates();
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title || !form.date || !form.time || form.locations.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        ...form,
        createdBy: currentUser.uid,
        creatorEmail: currentUser.email,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "eventRequests"), eventData);
      toast.success("Event request submitted successfully!");
      navigate("/events");
    } catch (error) {
      console.error("Error submitting event:", error);
      toast.error("Failed to submit event request");
    } finally {
      setLoading(false);
    }
  };

  const Calendar = () => (
    <div className="absolute top-full mt-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 shadow-lg z-20">
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-white/70 text-sm py-2">{day}</div>
        ))}
        {availableDates.map((dateObj, index) => (
          <button
            key={index}
            onClick={() => {
              setForm(prev => ({ ...prev, date: dateObj.date.toISOString().split('T')[0] }));
              setShowCalendar(false);
            }}
            className={`
              p-2 text-sm rounded-lg text-center
              ${dateObj.isAvailable 
                ? 'bg-blue-600/20 hover:bg-blue-600/30 text-white cursor-pointer' 
                : 'bg-red-600/20 text-white/50 cursor-not-allowed'}
            `}
            disabled={!dateObj.isAvailable}
          >
            {dateObj.date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden font-sans bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 p-4">
      <Toaster position="top-right" />
      
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-3xl animate-float"
          style={{ top: '10%', right: '15%' }}
        ></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl animate-float-delay"
          style={{ bottom: '5%', left: '10%' }}
        ></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        
        {/* Floating particles */}
        <div className="particles absolute inset-0">
          {Array(20).fill().map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-30 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Back button */}
        <Link 
          to="/events" 
          className="flex items-center text-white mb-4 hover:text-white/80 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Events
        </Link>

        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden">
          {/* Card header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-700/80 to-indigo-800/80 p-8">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-10"></div>
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-white/10 rounded-full"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-white text-2xl font-bold">Host an Event</h1>
                  <p className="text-white/70 text-sm">Create and submit your event</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Event Title */}
            <div className="space-y-2">
              <label className="text-white text-sm">Event Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Give your event a name"
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-white text-sm">Date</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.date}
                    onFocus={() => setShowCalendar(true)}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Select a date"
                    readOnly
                    required
                  />
                  {showCalendar && <Calendar />}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm">Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-white text-sm">Location</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        locations: prev.locations.includes(loc.id)
                          ? prev.locations.filter(id => id !== loc.id)
                          : [...prev.locations, loc.id]
                      }));
                    }}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-xl border transition-colors ${
                      form.locations.includes(loc.id)
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-white text-sm">{loc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-white text-sm">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-xl border transition-colors ${
                      form.category === cat.id
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="text-white text-sm">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Registration Link */}
            <div className="space-y-2">
              <label className="text-white text-sm">Registration Link</label>
              <input
                type="url"
                value={form.registrationLink}
                onChange={(e) => setForm({ ...form, registrationLink: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional: Link for registration or tickets"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                "Create Event"
              )}
            </button>
          </form>
        </div>

        {/* Card reflection */}
        <div className="mt-1 w-full h-8 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-sm"></div>
      </div>
    </div>
  );
}
