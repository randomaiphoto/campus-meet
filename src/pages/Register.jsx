// src/pages/Register.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Link might be used for a "Login" link
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [fullName, setFullName] = useState(''); // New state
  const [mobileNo, setMobileNo] = useState(''); // New state
  const [course, setCourse] = useState('');     // New state
  const [year, setYear] = useState('');         // New state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // currentUser from useAuth will now contain the merged Firebase Auth and Firestore user data, including role
  const { currentUser, signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if user is logged in and role is available
    if (currentUser && currentUser.role) {
      navigate(`/${currentUser.role}`); // Use currentUser.role
    }
  }, [currentUser, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (!fullName.trim()) { // Basic validation for new fields
        return setError('Full Name is required');
    }
    if (!course.trim()) {
        return setError('Course is required');
    }
    if (!year.trim()) {
        return setError('Year is required');
    }
    
    try {
      setError('');
      setLoading(true);
      const additionalData = {
        name: fullName, // Changed from fullName to name to match Firestore field
        mobileNo,
        course,
        year,
      };
      await signup(email, password, additionalData); // Pass additionalData
      // Navigation is now handled by useEffect based on currentUser and role update
      // navigate('/'); // Or navigate to a specific page post-registration like /student or /profile-setup
    } catch (err) {
      setError('Failed to create an account: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-700 relative overflow-hidden p-4">
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute rounded-full bg-indigo-500/20 w-72 h-72 -top-20 -left-20 backdrop-blur-xl animate-float"></div>
        <div className="absolute rounded-full bg-purple-500/20 w-96 h-96 -bottom-20 -right-20 backdrop-blur-xl animate-float-delay"></div>
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden max-w-xl w-full bg-white/10 backdrop-blur-lg border border-white/20">
        <div className="w-full p-8 md:p-10 flex flex-col justify-center">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Create Your Account</h2>
            <p className="text-white/80">Join Campus Central and dive into campus life!</p>
          </div>
          
          {error && (
            <div className="bg-red-500/30 border border-red-700 text-white px-4 py-3 rounded-lg mb-4 text-sm" role="alert">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="full-name" className="sr-only">Full Name</label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Course and Year (side-by-side) */}
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-4 sm:space-y-0">
              <div className="sm:w-1/2">
                <label htmlFor="course" className="sr-only">Course</label>
                <input
                  id="course"
                  name="course"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm"
                  placeholder="Course (e.g., Computer Science)"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>
              <div className="sm:w-1/2">
                <label htmlFor="year" className="sr-only">Year</label>
                <input
                  id="year"
                  name="year"
                  type="text" // Could be number, but text is flexible (e.g., "Final Year", "1st Year")
                  required
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm"
                  placeholder="Year (e.g., 2nd Year)"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
            </div>

            {/* Mobile Number (Optional) */}
            <div>
              <label htmlFor="mobile-no" className="sr-only">Mobile Number (Optional)</label>
              <input
                id="mobile-no"
                name="mobileNo"
                type="tel"
                autoComplete="tel"
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm"
                placeholder="Mobile Number (Optional)"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 bg-white/10 border border-white/20 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition duration-150 ease-in-out"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-white/70">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/40 text-xs">
              © {new Date().getFullYear()} Campus Central. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
