import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";

export default function HostEvent() {
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is authenticated and has the right role
    if (!currentUser) {
      navigate("/login");
    } else if (role && role !== "student") {
      toast.error("Only students can request to host events");
      navigate(`/${role}`);
    }
  }, [currentUser, role, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error for this field once the user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { title, date, time, location, description } = form;
    
    if (!title.trim()) newErrors.title = "Event title is required";
    if (!date) newErrors.date = "Date is required";
    if (!time) newErrors.time = "Time is required";
    if (!location.trim()) newErrors.location = "Location is required";
    if (!description.trim()) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all the required fields");
      return;
    }

    if (!currentUser) {
      toast.error("You must be logged in");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      // Combine date and time
      const eventDateTime = new Date(`${form.date}T${form.time}`);
      
      // Submit event request to Firestore
      await addDoc(collection(db, "eventRequests"), {
        title: form.title,
        description: form.description,
        date: eventDateTime,
        location: form.location,
        createdBy: currentUser.uid,
        creatorEmail: currentUser.email,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      
      toast.success("Event request submitted for approval!");
      
      // Reset form
      setForm({
        title: "",
        date: "",
        time: "",
        location: "",
        description: "",
      });
      
      // Redirect to student dashboard after a delay
      setTimeout(() => {
        navigate("/student");
      }, 2000);
    } catch (error) {
      console.error("Error submitting event:", error);
      toast.error("Something went wrong! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 font-['Inter',sans-serif] relative overflow-hidden p-4 sm:p-6 md:p-8">
      {/* Toast notifications */}
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Glassmorphic background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 -left-10 w-40 sm:w-72 h-40 sm:h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-60 sm:w-96 h-60 sm:h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-52 sm:w-80 h-52 sm:h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Back button */}
        <button 
          onClick={() => navigate("/student")}
          className="flex items-center text-[#4285F4] hover:text-[#3367D6] transition mb-4 sm:mb-6"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to dashboard
        </button>
        
        <div className="bg-white/30 backdrop-filter backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl overflow-hidden">
          {/* Form header */}
          <div className="bg-[#4285F4] text-white p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Request to Host Event</h1>
            <p className="text-blue-100 mt-2">Fill in the details to submit your event for approval</p>
          </div>
          
          {/* Form body */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Event Title */}
            <div>
              <label 
                htmlFor="title" 
                className={`block text-sm font-medium ${errors.title ? 'text-red-500' : 'text-gray-700'} mb-1 ml-1`}
              >
                Event Title
              </label>
              <div className={`relative border ${focusedField === 'title' ? 'border-[#4285F4]' : errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-white/50 backdrop-blur-md shadow-sm transition-all duration-200`}>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Give your event a catchy title"
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 bg-transparent outline-none text-gray-800 rounded-lg"
                />
              </div>
              {errors.title && <p className="mt-1 ml-1 text-xs text-red-500">{errors.title}</p>}
            </div>
            
            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label 
                  htmlFor="date" 
                  className={`block text-sm font-medium ${errors.date ? 'text-red-500' : 'text-gray-700'} mb-1 ml-1`}
                >
                  Date
                </label>
                <div className={`relative border ${focusedField === 'date' ? 'border-[#4285F4]' : errors.date ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-white/50 backdrop-blur-md shadow-sm transition-all duration-200`}>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('date')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-transparent outline-none text-gray-800 rounded-lg"
                  />
                </div>
                {errors.date && <p className="mt-1 ml-1 text-xs text-red-500">{errors.date}</p>}
              </div>
              
              {/* Time */}
              <div>
                <label 
                  htmlFor="time" 
                  className={`block text-sm font-medium ${errors.time ? 'text-red-500' : 'text-gray-700'} mb-1 ml-1`}
                >
                  Time
                </label>
                <div className={`relative border ${focusedField === 'time' ? 'border-[#4285F4]' : errors.time ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-white/50 backdrop-blur-md shadow-sm transition-all duration-200`}>
                  <input
                    id="time"
                    name="time"
                    type="time"
                    value={form.time}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('time')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 bg-transparent outline-none text-gray-800 rounded-lg"
                  />
                </div>
                {errors.time && <p className="mt-1 ml-1 text-xs text-red-500">{errors.time}</p>}
              </div>
            </div>
            
            {/* Location */}
            <div>
              <label 
                htmlFor="location" 
                className={`block text-sm font-medium ${errors.location ? 'text-red-500' : 'text-gray-700'} mb-1 ml-1`}
              >
                Location
              </label>
              <div className={`relative border ${focusedField === 'location' ? 'border-[#4285F4]' : errors.location ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-white/50 backdrop-blur-md shadow-sm transition-all duration-200`}>
                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Where will the event take place?"
                  onFocus={() => setFocusedField('location')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 bg-transparent outline-none text-gray-800 rounded-lg"
                />
              </div>
              {errors.location && <p className="mt-1 ml-1 text-xs text-red-500">{errors.location}</p>}
            </div>
            
            {/* Description */}
            <div>
              <label 
                htmlFor="description" 
                className={`block text-sm font-medium ${errors.description ? 'text-red-500' : 'text-gray-700'} mb-1 ml-1`}
              >
                Description
              </label>
              <div className={`relative border ${focusedField === 'description' ? 'border-[#4285F4]' : errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-white/50 backdrop-blur-md shadow-sm transition-all duration-200`}>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Provide details about your event"
                  rows={4}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 bg-transparent outline-none text-gray-800 rounded-lg resize-none"
                />
              </div>
              {errors.description && <p className="mt-1 ml-1 text-xs text-red-500">{errors.description}</p>}
            </div>
            
            {/* Submit button - Neumorphic design */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#34A853] hover:bg-[#2E9549] text-white rounded-xl shadow-lg py-3 font-medium transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-70 disabled:transform-none focus:outline-none focus:ring-2 focus:ring-[#34A853] focus:ring-offset-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </div>
                ) : "Submit for Approval"}
              </button>
            </div>
            
            {/* Info text */}
            <div className="text-center text-sm text-gray-500">
              <p>Your event request will be reviewed by faculty members.</p>
              <p>You will be notified once it's approved.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
