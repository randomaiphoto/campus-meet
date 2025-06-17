import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function FacultyDashboard() {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [eventRequests, setEventRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("event-requests");
  
  // Add these new state variables
  const [filterDate, setFilterDate] = useState("");
  const [filterClub, setFilterClub] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [clubs, setClubs] = useState([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch event requests with status filter
        const eventRequestsQuery = query(
          collection(db, "eventRequests"),
          where("status", "==", filterStatus),
          orderBy("createdAt", "desc")
        );
        
        const eventRequestsSnapshot = await getDocs(eventRequestsQuery);
        const eventRequestsData = eventRequestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEventRequests(eventRequestsData);
        
        // Fetch clubs for filter dropdown
        const clubsSnapshot = await getDocs(collection(db, "clubs"));
        const clubsData = clubsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClubs(clubsData);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterStatus]); // Add dependency on filterStatus

  // Apply all filters to event requests
  const filteredRequests = eventRequests
    .filter(request => {
      // Apply club filter
      if (filterClub !== "all" && request.clubId !== filterClub) {
        return false;
      }
      
      // Apply date filter
      if (filterDate) {
        const requestDate = request.date?.toDate?.() || request.date;
        const filterDateObj = new Date(filterDate);
        
        // Compare only the date part (ignoring time)
        return (
          requestDate.getFullYear() === filterDateObj.getFullYear() &&
          requestDate.getMonth() === filterDateObj.getMonth() &&
          requestDate.getDate() === filterDateObj.getDate()
        );
      }
      
      return true;
    });

  // Handle rejection of event requests
  const openRejectionModal = (requestId) => {
    setCurrentRequestId(requestId);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const handleRejectRequest = async () => {
    if (!currentRequestId) return;
    
    try {
      setActionLoading(true);
      
      // Update the request status with rejection reason
      const requestRef = doc(db, "eventRequests", currentRequestId);
      await updateDoc(requestRef, {
        status: "rejected",
        rejectedBy: currentUser.uid,
        rejectedAt: serverTimestamp(),
        rejectionReason: rejectionReason.trim() || "No reason provided"
      });
      
      // Remove the request from the UI if showing only pending requests
      if (filterStatus === "pending") {
        setEventRequests(prev => prev.filter(req => req.id !== currentRequestId));
      } else {
        // Update the request in the UI
        setEventRequests(prev => prev.map(req => 
          req.id === currentRequestId 
            ? {...req, status: "rejected", rejectionReason, rejectedAt: new Date()} 
            : req
        ));
      }
      
      setShowRejectionModal(false);
      toast.success("Event request rejected");
    } catch (error) {
      console.error("Error rejecting event:", error);
      toast.error("Failed to reject event");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setActionLoading(true);
      
      // Update the request status to approved
      const requestRef = doc(db, "eventRequests", requestId);
      await updateDoc(requestRef, {
        status: "approved",
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp()
      });
      
      // Update the request in the UI
      setEventRequests(prev => prev.map(req => 
        req.id === requestId 
          ? {...req, status: "approved", approvedAt: new Date()} 
          : req
      ));
      
      toast.success("Event request approved");
    } catch (error) {
      console.error("Error approving event:", error);
      toast.error("Failed to approve event");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{currentUser?.email}</span>
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h2 className="text-xl font-semibold mb-4">Welcome to your Faculty Dashboard!</h2>
            <p>Here you can approve events and manage student participation.</p>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium">Events Pending Approval</h3>
              <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  <li>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          Sample Event Title
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Organized by: Sample Organizer
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Requested: Dec 15, 2022
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm">
                          Approve
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm">
                          Reject
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-5 w-5 mr-3 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4zm16 0a8 8 0 01-8 8v-4a4 4 0 004-4h4z"></path>
              </svg>
              <span className="text-gray-600">Loading data...</span>
            </div>
          ) : (
            <>
              {/* Event Requests Tab */}
              {activeTab === "event-requests" && (
                <div>
                  <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4285F4] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-800">Event Requests</h2>
                  </div>
                  
                  {/* Filters */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg flex flex-wrap gap-4">
                    {/* Status filter */}
                    <div className="w-full sm:w-auto">
                      <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="status-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All Requests</option>
                      </select>
                    </div>
                    
                    {/* Club filter */}
                    <div className="w-full sm:w-auto">
                      <label htmlFor="club-filter" className="block text-sm font-medium text-gray-700 mb-1">
                        Club
                      </label>
                      <select
                        id="club-filter"
                        value={filterClub}
                        onChange={(e) => setFilterClub(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="all">All Clubs</option>
                        {clubs.map(club => (
                          <option key={club.id} value={club.id}>{club.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Date filter */}
                    <div className="w-full sm:w-auto">
                      <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                        Event Date
                      </label>
                      <input
                        type="date"
                        id="date-filter"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    {/* Clear filters button */}
                    <div className="w-full sm:w-auto flex items-end">
                      <button
                        onClick={() => {
                          setFilterDate("");
                          setFilterClub("all");
                          setFilterStatus("pending");
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset Filters
                      </button>
                    </div>
                  </div>
                  
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-800">No requests found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {filterStatus === "pending" 
                          ? "No pending requests to review at this time."
                          : "No requests match your current filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredRequests.map((request) => (
                        <div key={request.id} className="py-6 first:pt-0 last:pb-0">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between">
                            <div className="flex-grow">
                              <div className="flex items-center mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 mr-3">{request.title}</h3>
                                
                                {/* Status Badge */}
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </span>
                              </div>
                              
                              <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500 gap-4">
                                <div className="flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(request.date)}
                                </div>
                                <div className="flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {request.location}
                                </div>
                                
                                <div className="flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Submitted: {formatDate(request.createdAt)}
                                </div>
                              </div>
                              
                              {/* Student information */}
                              {request.student && (
                                <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                                  <h4 className="text-sm font-medium text-blue-800 mb-1">Requester Information</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center">
                                      <svg className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="text-gray-700">{request.student.name}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <svg className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-gray-700">{request.student.email}</span>
                                    </div>
                                    {request.student.course && (
                                      <div className="flex items-center">
                                        <svg className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13c-1.168-.776-2.754-1.253-4.5-1.253-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        <span className="text-gray-700">{request.student.course}</span>
                                      </div>
                                    )}
                                    {request.student.year && (
                                      <div className="flex items-center">
                                        <svg className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-gray-700">Year {request.student.year}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-3">
                                <p className="text-gray-600">{request.description}</p>
                              </div>
                              
                              {/* Rejection reason (if rejected) */}
                              {request.status === 'rejected' && request.rejectionReason && (
                                <div className="mt-3 bg-red-50 p-3 rounded-lg">
                                  <h4 className="text-sm font-medium text-red-800 mb-1">Rejection Reason</h4>
                                  <p className="text-sm text-red-700">{request.rejectionReason}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Action buttons - only show for pending requests */}
                            {request.status === 'pending' && (
                              <div className="mt-4 lg:mt-0 lg:ml-6 flex space-x-3">
                                <button
                                  onClick={() => handleApproveRequest(request.id)}
                                  disabled={actionLoading}
                                  className="bg-[#34A853] hover:bg-[#2E9549] text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                
                                <button
                                  onClick={() => openRejectionModal(request.id)}
                                  disabled={actionLoading}
                                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Rejection Modal */}
                  {showRejectionModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Event Request</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Please provide a reason for rejecting this event request. This will be shared with the student who submitted the request.
                        </p>
                        
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-4"
                          rows={4}
                          placeholder="Enter reason for rejection (optional)"
                        ></textarea>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setShowRejectionModal(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleRejectRequest}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Add Faculty Tab */}
              {/* ...existing code... */}
              
              {/* Add Club Tab */}
              {/* ...existing code... */}
              
              {/* Events Tab */}
              {/* ...existing code... */}
            </>
          )}
        </div>
        
        {/* ...existing code... */}
      </main>
    </div>
  );
}
