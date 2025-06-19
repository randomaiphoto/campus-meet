import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast, Toaster } from 'react-hot-toast';
import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';
import FacultyNavbar from '../components/FacultyNavbar';

export default function FacultyList() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    phone: '',
    facultyId: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "faculty"));
      const querySnapshot = await getDocs(q);
      const facultyList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFaculties(facultyList);
    } catch (error) {
      console.error("Error fetching faculties:", error);
      toast.error("Failed to load faculty data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate a secure random password
      const password = nanoid(12);
      
      // Create auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        password
      );

      // Create Firestore record
      await addDoc(collection(db, "users"), {
        uid: userCredential.user.uid,
        ...formData,
        role: "faculty",
        createdAt: new Date()
      });

      // Show success message with password
      toast.success(
        (t) => (
          <div>
            <p>Faculty account created!</p>
            <div className="flex items-center mt-2 bg-white/10 rounded p-2">
              <span className="font-mono text-sm mr-2">{password}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(password);
                  toast.success("Password copied to clipboard!");
                }}
                className="p-1 hover:bg-white/10 rounded"
              >
                📋
              </button>
            </div>
          </div>
        ),
        { duration: 10000 }
      );

      setShowAddModal(false);
      setFormData({
        fullName: '',
        email: '',
        department: '',
        phone: '',
        facultyId: ''
      });
      fetchFaculties();
    } catch (error) {
      console.error("Error adding faculty:", error);
      toast.error("Failed to create faculty account");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (facultyId) => {
    if (window.confirm("Are you sure you want to remove this faculty member?")) {
      try {
        await deleteDoc(doc(db, "users", facultyId));
        toast.success("Faculty removed successfully");
        fetchFaculties();
      } catch (error) {
        console.error("Error removing faculty:", error);
        toast.error("Failed to remove faculty");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900">
      <Toaster position="top-right" />
      
     

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">

         <FacultyNavbar />

        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-3xl animate-float"
          style={{ top: '10%', right: '15%' }}
        ></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl animate-float-delay"
          style={{ bottom: '5%', left: '10%' }}
        ></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>Add Faculty</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            Array(6).fill().map((_, i) => (
              <div key={i} className="animate-pulse backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6">
                <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
              </div>
            ))
          ) : faculties.length > 0 ? (
            faculties.map(faculty => (
              <div key={faculty.id} className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 p-6 group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{faculty.fullName}</h3>
                    <p className="text-white/70">{faculty.department}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(faculty.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-lg"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2 text-sm text-white/70">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {faculty.email}
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {faculty.phone}
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    {faculty.facultyId}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-white/70">No faculty members found. Add your first faculty member.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-white mb-6">Add New Faculty</h2>
            
            <form onSubmit={handleAddFaculty} className="space-y-4">
              <div className="space-y-2">
                <label className="text-white text-sm">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter faculty name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter department"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Faculty ID</label>
                <input
                  type="text"
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter faculty ID"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
