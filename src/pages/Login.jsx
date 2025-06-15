// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser, role, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && role) {
      navigate(`/${role}`);
    }
  }, [currentUser, role]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Failed to sign in: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError("Failed to sign in with Google: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-700 relative overflow-hidden">
      {/* Abstract shapes */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div className="absolute rounded-full bg-indigo-500/20 w-72 h-72 -top-20 -left-20 backdrop-blur-xl"></div>
        <div className="absolute rounded-full bg-purple-500/20 w-96 h-96 -bottom-20 -right-20 backdrop-blur-xl"></div>
        <div className="absolute rounded-full bg-violet-500/10 w-80 h-80 bottom-40 left-20 backdrop-blur-sm"></div>
      </div>

      {/* Login card */}
      <div className="relative z-10 flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden max-w-5xl w-11/12 md:w-3/4 lg:w-2/3 bg-white/10 backdrop-blur-lg border border-white/20">
        {/* Image side */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-700 to-violet-800 p-10 flex flex-col justify-center relative overflow-hidden">
          {/* Shapes */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 opacity-20 blur-2xl"></div>
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 opacity-20 blur-xl"></div>

          <div className="relative z-10 text-white">
            <h1 className="text-4xl font-bold mb-6">Campus Central</h1>
            <p className="text-lg text-white/80 mb-8">
              Your complete campus experience management platform
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-1 rounded-full mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">
                  Access to university events & workshops
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-1 rounded-full mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">
                  Personalized dashboard for your role
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-1 rounded-full mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">
                  Quick notifications of important updates
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Login form side */}
        <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-white/70 text-sm">
              Sign in with your university account
            </p>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="-space-y-px">
              <div>
                <label
                  htmlFor="email-address"
                  className="sr-only"
                >
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="sr-only"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign in with Google
              </button>
            </div>
          </form>
          <div className="text-center">
            <p className="mt-2 text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
