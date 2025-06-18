// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { currentUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/events"); // Changed from /home to /events
    }
  }, [currentUser, navigate]);

  const handleTraditionalLogin = async (e) => {
    e.preventDefault();
    
    try {
      setError("");
      setLoading(true);

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        identifier,
        password
      );

      // After successful authentication, check user role in Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Redirect based on role
        switch(userData.role) {
          case "faculty":
            navigate("/faculty");
            break;
          case "student":
            navigate("/events");
            break;
          case "admin":
            navigate("/admin");
            break;
          default:
            navigate("/events");
        }
      } else {
        // If user document doesn't exist, create one for faculty accounts
        if (isFacultyEmail(identifier)) {
          await setDoc(doc(db, "users", userCredential.user.uid), {
            email: identifier,
            role: "faculty",
            createdAt: serverTimestamp()
          });
          navigate("/faculty");
        } else {
          navigate("/events"); // Default to student view
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if email is a faculty email
  const isFacultyEmail = (email) => {
    const facultyEmails = [
      "ujwala@gmail.com",
      "archana@gmail.com"
      // Add other faculty emails here
    ];
    return facultyEmails.includes(email);
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setGoogleLoading(true);
      await loginWithGoogle();
      navigate("/events"); // Changed from /home to /events
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden font-sans bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 p-4">
      {/* Static background elements with animation */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-3xl animate-float"
          style={{ 
            top: '10%',
            right: '15%'
          }}
        ></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl animate-float-delay"
          style={{ 
            bottom: '5%',
            left: '10%'
          }}
        ></div>
        
        {/* Subtle animated grid */}
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
      
      {/* Login card with glassmorphism */}
      <div className="relative z-10 max-w-md w-full mx-auto overflow-hidden">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden transition-all duration-300">
          {/* Animated card header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-700/80 to-indigo-800/80 p-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-10"></div>
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-white/10 rounded-full"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <h1 className="text-white text-2xl font-bold tracking-tight">CampusMeet</h1>
              </div>
            </div>
          </div>
          
          {/* Card body with sign-in options */}
          <div className="p-8">
            <h2 className="text-white text-xl font-semibold mb-6">Sign in to your account</h2>
            
            {/* Error message display */}
            {error && (
              <div className="mb-6 px-4 py-3 bg-red-800/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                <p className="text-white text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleTraditionalLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-white text-sm block">
                  Email / Username / Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50"
                    placeholder="Enter your email, username, or phone"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-white text-sm block">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white rounded-xl block w-full pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-white/70 hover:text-white focus:outline-none"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 bg-blue-500 focus:ring-blue-400 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <a href="#" className="text-white hover:text-white/80">
                    Forgot password?
                  </a>
                </div>
              </div>
              
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
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
            
            {/* Divider */}
            <div className="relative flex items-center my-6">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="flex-shrink mx-4 text-white text-xs uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>
            
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3.5 rounded-xl shadow-lg transition-all duration-300 relative overflow-hidden"
              aria-label="Sign in with Google"
            >
              {!googleLoading ? (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#ffffff"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#ffffff"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#ffffff"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#ffffff"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-white">Continue with Google</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-white">Signing in...</span>
                </div>
              )}
            </button>
            
            {/* CTA section */}
            <div className="mt-8 pt-6 border-t border-white/20 text-center">
              <p className="text-white text-sm">
                Don't have an account?{" "}
                <Link to="/register" className="text-white font-medium hover:text-blue-300 transition-colors">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Login card reflection effect */}
        <div className="mt-1 w-full h-8 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-sm"></div>
      </div>
      
      {/* Footer/Branding */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs">
        CampusMeet © {new Date().getFullYear()}
      </div>
    </div>
  );
}
