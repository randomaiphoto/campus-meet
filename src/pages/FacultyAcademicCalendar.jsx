import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import FacultyNavbar from "../components/FacultyNavbar";
import { toast, Toaster } from "react-hot-toast";

export default function FacultyAcademicCalendar() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    course: "",
    year: "",
    subject: "",
    day: "",
    startTime: "",
    endTime: "",
    faculty: "",
    room: "",
  });

  const courses = ["BCA", "BBA", "BAF", "MBA"];
  const years = ["I", "II", "III"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "academicSchedules"));
      const schedulesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchedules(schedulesData);
    } catch (error) {
      toast.error("Error fetching schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "academicSchedules"), {
        ...formData,
        createdAt: serverTimestamp()
      });
      toast.success("Schedule added successfully!");
      setShowAddModal(false);
      fetchSchedules();
      setFormData({
        course: "",
        year: "",
        subject: "",
        day: "",
        startTime: "",
        endTime: "",
        faculty: "",
        room: "",
      });
    } catch (error) {
      toast.error("Error adding schedule");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "academicSchedules", id));
      toast.success("Schedule deleted successfully!");
      fetchSchedules();
    } catch (error) {
      toast.error("Error deleting schedule");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900">
      <Toaster position="top-right" />
      <FacultyNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Academic Calendar</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Schedule</span>
          </button>
        </div>

        {/* Schedule Grid */}
        <div className="grid gap-6">
          {courses.map(course => (
            <div key={course} className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">{course}</h2>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70">Day</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70">Faculty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70">Room</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/70">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {schedules
                        .filter(schedule => schedule.course === course)
                        .map(schedule => (
                          <tr key={schedule.id} className="text-white">
                            <td className="px-4 py-3 text-sm">{schedule.day}</td>
                            <td className="px-4 py-3 text-sm">
                              {schedule.startTime} - {schedule.endTime}
                            </td>
                            <td className="px-4 py-3 text-sm">{schedule.subject}</td>
                            <td className="px-4 py-3 text-sm">{schedule.faculty}</td>
                            <td className="px-4 py-3 text-sm">{schedule.room}</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => handleDelete(schedule.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Add New Schedule</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Course and Year */}
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Course</label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    required
                  >
                    <option value="" disabled>Select Course</option>
                    {courses.map(course => (
                      <option key={course} value={course} className="bg-gray-800">{course}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    required
                  >
                    <option value="" disabled>Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year} className="bg-gray-800">{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Other fields */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Day</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="" disabled>Select Day</option>
                  {days.map(day => (
                    <option key={day} value={day} className="bg-gray-800">{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Room</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
