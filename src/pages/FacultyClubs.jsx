import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FacultyNavbar from '../components/FacultyNavbar';

export default function FacultyClubs() {
  const [clubs, setClubs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leadId: '',
    category: 'tech' // Default category
  });

  // Club categories with icons
  const categories = [
    { id: 'tech', name: 'Technology', icon: '💻' },
    { id: 'cultural', name: 'Cultural', icon: '🎭' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'academic', name: 'Academic', icon: '📚' },
    { id: 'social', name: 'Social', icon: '🤝' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First check if user is authenticated and is faculty
        if (!currentUser) {
          throw new Error("Not authenticated");
        }

        // Verify faculty role
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== "faculty") {
          throw new Error("Insufficient permissions");
        }

        // Fetch clubs
        const clubsSnap = await getDocs(collection(db, "clubs"));
        const clubData = clubsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClubs(clubData);

        // Fetch students for club lead selection
        const studentsQuery = query(
          collection(db, "users"),
          where("role", "==", "student")
        );
        const studentsSnap = await getDocs(studentsQuery);
        const studentData = studentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentData);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedClub) {
        // Update existing club
        await updateDoc(doc(db, 'clubs', selectedClub.id), formData);
        toast.success('Club updated successfully');
      } else {
        // Create new club
        await addDoc(collection(db, 'clubs'), {
          ...formData,
          createdBy: currentUser.uid,
          createdAt: new Date()
        });
        toast.success('Club created successfully');
      }
      setShowAddModal(false);
      setSelectedClub(null);
      setFormData({ name: '', description: '', leadId: '', category: 'tech' });
      fetchData();
    } catch (error) {
      console.error('Error saving club:', error);
      toast.error('Failed to save club');
    }
  };

  // Helper function to check active nav item
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900">
      
      
      <Toaster position="top-right" />

      <FacultyNavbar />
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-3xl animate-float"
          style={{ top: '10%', right: '15%' }}
        ></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl animate-float-delay"
          style={{ bottom: '5%', left: '10%' }}
        ></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Club Management</h1>

        {/* Clubs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-white/5 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : clubs.length > 0 ? (
          <>
            {/* Add Club Button when clubs exist */}
            

            {/* Clubs Grid with Add Club Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Add Club Card - First in grid */}
              <div 
                onClick={() => setShowAddModal(true)}
                className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 overflow-hidden group cursor-pointer hover:bg-white/20 transition-all duration-300"
              >
                <div className="p-6 h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Add New Club</h3>
                  <p className="text-white/70 text-sm">Create a new club and assign a club lead</p>
                  
                  {/* Decorative elements */}
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-tl-full transform translate-x-8 translate-y-8 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-300"></div>
                </div>
              </div>

              {/* Existing Club Cards */}
              {clubs.map(club => (
                <div key={club.id} className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 overflow-hidden group">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xl">
                          {categories.find(cat => cat.id === club.category)?.icon || '🎨'}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">{club.name}</h3>
                          <p className="text-white/70 text-sm">{categories.find(cat => cat.id === club.category)?.name}</p>
                        </div>
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedClub(club);
                            setFormData(club);
                            setShowAddModal(true);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-white/80 text-sm mb-4">{club.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="text-sm">
                          <p className="text-white/70">Club Lead</p>
                          <p className="text-white font-medium">
                            {students.find(s => s.id === club.leadId)?.fullName || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Empty state with centered Add Club button
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Clubs Yet</h2>
            <p className="text-white/70 mb-8">Create your first club to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center space-x-2 border-2 border-indigo-400 hover:border-indigo-300 shadow-lg hover:shadow-indigo-500/50"
            >
              <span className='text-white'>Add Your First Club</span>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Club Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {selectedClub ? 'Edit Club' : 'Add New Club'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="pl-1 text-white text-sm mb-2 ml-2.2 block">Club Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter club name"
                  required
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block ml-2.2 pl-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="" disabled className="bg-gray-800">Select Category</option>
                  {categories.map(cat => (
                    <option 
                      key={cat.id} 
                      value={cat.id}
                      className="bg-gray-800 text-white"
                    >
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white text-sm mb-2 block ml-2.2 pl-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter club description"
                  rows="3"
                  required
                />
              </div>

              {/* Club Lead Selection */}
              <div className="space-y-2">
                <label className="text-white text-sm ml-1 mb-2 block">Club Lead</label>
                <select
                  value={formData.leadId}
                  onChange={(e) => setFormData(prev => ({ ...prev, leadId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  required
                >
                  <option value="" className="bg-gray-800">Select Club Lead</option>
                  {students.map(student => (
                    <option 
                      key={student.id} 
                      value={student.id}
                      className="bg-gray-800 text-white"
                    >
                      {`${student.fullName} ${student.course}-${student.year}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedClub(null);
                    setFormData({ name: '', description: '', leadId: '', category: 'tech' });
                  }}
                  className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className='text-white'>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <span className='text-white  text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mr-0.5'>
                    {selectedClub ? 'Save Changes' : 'Create Club'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

