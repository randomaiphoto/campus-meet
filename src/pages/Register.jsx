// src/pages/Register.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";

export default function Register() {
  const { currentUser, role, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && role) {
      navigate(`/${role}`);
    }
  }, [currentUser, role]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-700 relative overflow-hidden">
      {/* Abstract shapes */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute rounded-full bg-indigo-500/20 w-72 h-72 -top-20 -left-20 backdrop-blur-xl animate-float"></div>
        <div className="absolute rounded-full bg-purple-500/20 w-96 h-96 -bottom-20 -right-20 backdrop-blur-xl animate-float-delay"></div>
        <div className="absolute rounded-full bg-violet-500/10 w-80 h-80 bottom-40 left-20 backdrop-blur-sm"></div>
      </div>
      
      {/* Registration card */}
      <div className="relative z-10 flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden max-w-5xl w-11/12 md:w-3/4 lg:w-2/3 bg-white/10 backdrop-blur-lg border border-white/20">
        
        {/* Form side */}
        <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-center order-2 md:order-1">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">Join Campus Central</h2>
            <p className="text-white/70 text-sm">Create your account to get started</p>
          </div>
          
          <button
            onClick={loginWithGoogle}
            className="relative w-full py-3 px-4 bg-white text-gray-800 rounded-xl flex items-center justify-center group hover:bg-gray-100 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-indigo-600 group-hover:w-full opacity-90 transition-all duration-300 z-0"></div>
            <div className="relative z-10 flex items-center justify-center group-hover:text-white transition-colors duration-200">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="currentColor"/>
              </svg>
              <span className="font-medium">Sign up with Google</span>
            </div>
          </button>
          
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">Already have an account? 
              <a href="/" className="ml-1 text-white hover:text-indigo-200 transition-colors">
                Sign in
              </a>
            </p>
          </div>
          
          <div className="mt-10 pt-6 border-t border-white/10 text-center">
            <p className="text-white/40 text-xs">
              © 2023 Campus Central. All rights reserved.
            </p>
          </div>
        </div>

        {/* Image side */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-700 to-violet-800 p-10 flex flex-col justify-center relative overflow-hidden order-1 md:order-2">
          {/* Shapes */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 opacity-20 blur-2xl"></div>
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 opacity-20 blur-xl"></div>
          
          <div className="relative z-10 text-white">
            <h1 className="text-4xl font-bold mb-6">Get Started</h1>
            <p className="text-lg text-white/80 mb-8">Create your account and join the campus community</p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-1 rounded-full mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">Student-friendly interface</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-1 rounded-full mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">Register for events with one click</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-1 rounded-full mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">Access to exclusive campus resources</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
