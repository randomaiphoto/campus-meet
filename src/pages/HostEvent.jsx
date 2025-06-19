import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
import { collection, addDoc, doc, getDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { toast, Toaster } from 'react-hot-toast';
import AcademicCalendar from '../components/AcademicCalendar';
import StudentNavbar from "../components/StudentNavbar";

export default function HostEvent() {
  const [form, setForm] = useState({
    title: "",
    location: "", // Changed from locations array to single string
    category: "",
    registrationLink: "",
    clubName: "",
    selectedDate: null  // Will be set when user selects from calendar
  });

  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isClubLead, setIsClubLead] = useState(false);
  const [userClubs, setUserClubs] = useState([]);
  const [isAllowed, setIsAllowed] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [locationAvailability, setLocationAvailability] = useState({});
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Organize locations with icons
  const locations = [
    { id: "lab401", name: "Lab 401", icon: "🏫" },
    { id: "lab402", name: "Lab 402", icon: "🏫" },
    { id: "lab503", name: "Lab 503", icon: "🏫" },
    { id: "seminar", name: "Seminar Hall", icon: "🎪" }
  ];

  const categories = [
    { id: "academic", name: "Academic", icon: "🎓" },
    { id: "cultural", name: "Cultural", icon: "🎭" },
    { id: "technical", name: "Technical", icon: "💻" },
    { id: "sports", name: "Sports", icon: "⚽" },
    { id: "workshop", name: "Workshop", icon: "🛠️" }
  ];

  useEffect(() => {
    const checkClubLeadStatus = async () => {
      if (!currentUser) return;

      try {
        // Check if user is faculty
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        
        if (userData?.role === 'faculty') {
          setIsAllowed(true);
          return;
        }

        // Check if user is club lead
        const clubsQuery = query(
          collection(db, "clubs"),
          where("leadId", "==", currentUser.uid)
        );
        
        const querySnapshot = await getDocs(clubsQuery);
        const clubs = [];
        querySnapshot.forEach((doc) => {
          clubs.push({ id: doc.id, ...doc.data() });
        });
        
        setUserClubs(clubs);
        setIsAllowed(clubs.length > 0);

        // If user is club lead, set their club as default
        if (clubs.length > 0) {
          setForm(prev => ({
            ...prev,
            clubId: clubs[0].id,
            clubName: clubs[0].name
          }));
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        toast.error("Error checking permissions");
      }
    };

    const fetchAvailableDates = async () => {
      try {
        // First check if user is authenticated
        if (!currentUser) {
          throw new Error("Not authenticated");
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // Look ahead 3 months

        // Fetch booked events
        const eventsRef = collection(db, "events");
        const eventsSnap = await getDocs(eventsRef);
        const bookedDates = {};

        eventsSnap.forEach(doc => {
          const eventData = doc.data();
          const eventDate = eventData.date?.toDate?.() || new Date(eventData.date);
          const dateStr = eventDate.toISOString().split('T')[0];
          
          if (!bookedDates[dateStr]) {
            bookedDates[dateStr] = new Set();
          }
          if (eventData.location) {
            bookedDates[dateStr].add(eventData.location);
          }
        });

        // Generate available dates
        const dates = [];
        const current = new Date(startDate);
        
        while (current <= endDate) {
          const dateStr = current.toISOString().split('T')[0];
          const isAvailable = !bookedDates[dateStr] || 
                            bookedDates[dateStr].size < locations.length;
          
          dates.push({
            date: new Date(current),
            isAvailable,
            bookedLocations: bookedDates[dateStr] || new Set()
          });

          current.setDate(current.getDate() + 1);
        }

        setAvailableDates(dates);
      } catch (error) {
        console.error("Error fetching available dates:", error);
        toast.error("Failed to load available dates");
      }
    };

    checkClubLeadStatus();
    fetchAvailableDates();
  }, [currentUser, navigate]);

  const handleDateSelect = (selectedDate) => {
    setForm(prev => ({
      ...prev,
      selectedDate
    }));
    checkLocationAvailability(selectedDate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.selectedDate) {
      toast.error("Please select a date from the calendar");
      return;
    }

    if (!form.title || !form.location) {
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

  const checkLocationAvailability = async (date) => {
    try {
      setSelectedDate(date);
      
      // Format date to remove time component
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, "events"),
        where("date", ">=", startOfDay),
        where("date", "<=", endOfDay),
        where("status", "==", "approved")
      );
      
      const querySnapshot = await getDocs(q);
      const bookedLocations = new Set();
      
      querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        if (eventData.location) {
          bookedLocations.add(eventData.location);
        }
      });

      // Set all locations as available by default
      const availability = {};
      locations.forEach(loc => {
        availability[loc.id] = !bookedLocations.has(loc.id);
      });

      setLocationAvailability(availability);
    } catch (error) {
      console.error("Error checking availability:", error);
      // Set all locations as available if there's an error
      const availability = {};
      locations.forEach(loc => {
        availability[loc.id] = true;
      });
      setLocationAvailability(availability);
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

  // Helper function to check active nav item
  const isActive = (path) => {
    return location.pathname === path;
  };

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-white/70 mb-6">
            Only faculty members and club leads can host events.
          </p>
          <Link
            to="/events"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900">
      <Toaster position="top-right" />
      
    

      <StudentNavbar activeItem="hostEvent" />

      {/* Existing content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Host New Event</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Title */}
              <div className="space-y-2">
                <label className="text-white text-sm">Event Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50"
                  placeholder="Enter event title"
                  required
                />
              </div>

              {/* Location Dropdown */}
              <div className="space-y-2">
                <label className="text-white text-sm">Select Location</label>
                <select
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none"
                  required
                >
                  <option value="" className="bg-gray-800">Select a location</option>
                  {locations.map(location => (
                    <option 
                      key={location.id} 
                      value={location.id}
                      className="bg-gray-800"
                    >
                      {location.icon} {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Dropdown */}
              <div className="space-y-2">
                <label className="text-white text-sm">Select Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none"
                  required
                >
                  <option value="" className="bg-gray-800">Select a category</option>
                  {categories.map(category => (
                    <option 
                      key={category.id} 
                      value={category.id}
                      className="bg-gray-800"
                    >
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Registration Link */}
              <div className="space-y-2">
                <label className="text-white text-sm">Registration Link (Optional)</label>
                <input
                  type="url"
                  value={form.registrationLink}
                  onChange={(e) => setForm({ ...form, registrationLink: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                  placeholder="https://..."
                />
              </div>

              {/* Club selection for club leads */}
              {userClubs.length > 0 && (
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Select Club
                  </label>
                  <select
                    value={form.clubId}
                    onChange={(e) => {
                      const club = userClubs.find(c => c.id === e.target.value);
                      setForm(prev => ({
                        ...prev,
                        clubId: e.target.value,
                        clubName: club.name
                      }));
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                    required
                  >
                    {userClubs.map(club => (
                      <option key={club.id} value={club.id} className="bg-gray-800">
                        {club.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-colors"
              >
                <span className="text-white">Create Event</span>
              </button>
            </form>
          </div>

          {/* Calendar Section */}
          <div className="sticky top-24">
            <AcademicCalendar onDateSelect={handleDateSelect} />
            
            {/* Location availability will be shown here when a date is selected */}
            {form.selectedDate && locationAvailability && (
              <div className="mt-4 backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  Location Availability for {selectedDate.toLocaleDateString()}
                </h3>
                
                <div className="space-y-3">
                  {locations.map(location => (
                    <div 
                      key={location.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <span className="text-white">{location.name}</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        locationAvailability[location.id]
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {locationAvailability[location.id] ? 'Available' : 'Booked'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for date selection */}
      {showCalendar && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowCalendar(false)}></div>
          <Calendar />
        </div>
      )}
    </div>
  );
}

