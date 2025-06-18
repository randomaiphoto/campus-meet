import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp, getDoc, addDoc } from "firebase/firestore";
import { toast, Toaster } from 'react-hot-toast';
import AcademicCalendar from '../components/AcademicCalendar';

export default function FacultyDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch event requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(
          collection(db, "eventRequests"),
          where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        const requestData = [];
        querySnapshot.forEach((doc) => {
          requestData.push({ id: doc.id, ...doc.data() });
        });
        setRequests(requestData);
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, "eventRequests", requestId);
      const requestData = (await getDoc(requestRef)).data();

      // First, update the request status
      await updateDoc(requestRef, {
        status: "approved",
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp()
      });

      // Then, create a new approved event
      await addDoc(collection(db, "events"), {
        ...requestData,
        status: "approved",
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp()
      });
      
      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success("Event approved successfully!");
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve event");
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId || !rejectionReason.trim()) return;

    try {
      await updateDoc(doc(db, "eventRequests", selectedRequestId), {
        status: "rejected",
        rejectedBy: currentUser.uid,
        rejectedAt: serverTimestamp(),
        rejectionReason: rejectionReason.trim()
      });
      
      setRequests(prev => prev.filter(req => req.id !== selectedRequestId));
      setShowRejectionModal(false);
      setRejectionReason("");
      setSelectedRequestId(null);
      toast.success("Event rejected");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject event");
    }
  };

  const openRejectionModal = (requestId) => {
    setSelectedRequestId(requestId);
    setShowRejectionModal(true);
  };

  // Helper function to check active nav item
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900">
      <Toaster position="top-right" />
      
      {/* Background Effects */}
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
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Modified Navbar */}
        <nav className="bg-white/10 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Left side - Logo */}
              <div className="flex items-center">
                <span className="text-xl font-bold text-white">Faculty Dashboard</span>
              </div>

              {/* Right side - Navigation and Profile */}
              <div className="flex items-center space-x-8">
               
                            <div className="hidden md:flex items-center space-x-4">
                              <Link
                              to="/faculty"
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
                              isActive('/faculty')
                              ? 'bg-white/20'
                              : 'hover:bg-white/10'
                              }`}
                              >
                              <span className="text-white">Dashboard</span>
                              </Link>
                              <Link
                              to="/faculty/clubs"
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
                              isActive('/faculty/clubs')
                              ? 'bg-white/20'
                              : 'hover:bg-white/10'
                              }`}
                              >
                              <span className="text-white">Clubs</span>
                              </Link>
                              <Link
                              to="/faculty/faculties"
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
                              isActive('/faculty/faculties')
                              ? 'bg-white/20'
                              : 'hover:bg-white/10'
                              }`}
                              >
                              <span className="text-white">Faculties</span>
                              </Link>
                            </div>

                            
                            <div className="relative group">
                              <button className="flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors">
                              <span className="text-white">{currentUser?.email}</span>
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              </button>
                              
                              <div className="absolute right-0 mt-2 w-48 py-2 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                              <Link
                              to="/faculty/profile"
                              className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                              >
                              Profile Settings
                              </Link>
                              <button
                              onClick={() => auth.signOut()}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                              >
                              Sign Out
                              </button>
                              </div>
                            </div>
                            </div>
                            </div>
                            </div>

                            {/* Mobile Navigation Menu - Updated text colors */}
          <div className="md:hidden border-t border-white/10">
            <div className="px-2 py-3 space-y-1">
              <Link
                to="/faculty"
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/faculty')
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/faculty/clubs"
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/faculty/clubs')
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Clubs
              </Link>
              <Link
                to="/faculty/faculties"
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/faculty/faculties')
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Faculties
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Event Requests Section */}
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {['Pending Requests', 'Approved Events', 'Total Clubs'].map((title, i) => (
                  <div key={i} className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-medium text-white">{title}</h3>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {i === 0 ? requests.length : '0'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pending Requests */}
              <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Pending Event Requests</h2>
                  
                  {loading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-white/5 rounded-lg"></div>
                      ))}
                    </div>
                  ) : requests.length > 0 ? (
                    <div className="space-y-4">
                      {requests.map(request => (
                        <div key={request.id} className="bg-white/5 rounded-xl p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium text-white">{request.title}</h3>
                              <p className="text-white/70 mt-1">{request.description}</p>
                              <div className="mt-2 flex items-center text-sm text-white/60">
                                <span className="mr-4">📅 {new Date(request.date?.toDate?.() || request.date).toLocaleDateString()}</span>
                                <span>👥 {request.clubName}</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectionModal(request.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-white/70">No pending requests</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Calendar Section */}
            <div className="sticky top-24">
              <AcademicCalendar />
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Reject Event Request</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
            ></textarea>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

