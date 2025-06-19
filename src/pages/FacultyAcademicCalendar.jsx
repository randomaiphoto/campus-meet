import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import FacultyNavbar from "../components/FacultyNavbar";
import { toast, Toaster } from "react-hot-toast";
import { getStorage } from "firebase/storage";
import { uploadFile, importTimetable, readFileAsText, parseCSV } from "../utils/FileImporter";

export default function FacultyAcademicCalendar() {
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    faculty: "",
    startTime: "",
    endTime: "",
    day: "",
    course: "BCA",
    year: "I",
    division: "A"  // Add division with default value
  });
  const [selectedCell, setSelectedCell] = useState({
    day: "",
    timeSlot: ""
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState('csv');
  const [file, setFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef(null);
  const storage = getStorage();
  
  // Update timeSlots to cover 8:00 AM to 5:00 PM
  const timeSlots = [
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00"
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const courses = ["BCA", "BBA", "BAF", "MBA"];
  const years = ["I", "II", "III"];
  const divisions = ["A", "B", "C"];  // Add divisions array

  // Fetch schedules
  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      
      const querySnapshot = await getDocs(collection(db, "academicSchedules"));
      const schedulesData = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Include division in the key
        const key = `${data.course}-${data.year}-${data.division}-${data.day}-${data.startTime}`;
        schedulesData[key] = { id: doc.id, ...data };
      });
      
      setSchedules(schedulesData);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Error fetching schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format the data correctly for Firestore
      const scheduleData = {
        subject: formData.subject,
        faculty: formData.faculty,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        course: formData.course,
        year: formData.year,
        division: formData.division, // Include division
        createdAt: serverTimestamp()
      };

      // Check if we have the required fields
      if (!scheduleData.subject || !scheduleData.faculty || !scheduleData.day || !scheduleData.course || !scheduleData.year || !scheduleData.division) {
        toast.error("Please fill all required fields");
        return;
      }

      // Create a unique key for this schedule to avoid duplicates
      const key = `${scheduleData.course}-${scheduleData.year}-${scheduleData.division}-${scheduleData.day}-${scheduleData.startTime}`;
      
      // Add to Firestore with error handling
      const docRef = await addDoc(collection(db, "academicSchedules"), scheduleData);
      
      // Update local state with new schedule
      setSchedules(prev => ({
        ...prev,
        [key]: { id: docRef.id, ...scheduleData }
      }));
      
      toast.success("Schedule added successfully");
      setShowAddModal(false);
      
      // Reset form data
      setFormData({
        subject: "",
        faculty: "",
        startTime: "",
        endTime: "",
        day: "",
        course: formData.course, // Keep current selections
        year: formData.year,
        division: formData.division // Keep current division
      });
    } catch (error) {
      console.error("Error adding schedule:", error);
      toast.error(`Failed to add schedule: ${error.message}`);
    }
  };

  // Function to handle cell click
  const handleCellClick = (day, timeSlot) => {
    setSelectedCell({ day, timeSlot });
    const [startTime, endTime] = timeSlot.split("-");
    setFormData(prev => ({
      ...prev,
      day,
      startTime: startTime.trim(),
      endTime: endTime.trim()
    }));
    setShowAddModal(true);
  };

  // Function to handle file selection
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    try {
      // Preview based on file type
      if (selectedFile.type === 'text/csv' || 
          selectedFile.name.endsWith('.csv')) {
        // CSV file
        const text = await readFileAsText(selectedFile);
        const data = parseCSV(text);
        setImportPreview({ type: 'csv', data });
      } else if (selectedFile.type.includes('spreadsheet') || 
                selectedFile.name.endsWith('.xlsx') ||
                selectedFile.name.endsWith('.xls')) {
        // Excel file - just show file info
        setImportPreview({ 
          type: 'excel', 
          info: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`
        });
      } else if (selectedFile.type === 'application/pdf') {
        // PDF file - just show file info
        setImportPreview({ 
          type: 'pdf', 
          info: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`
        });
      } else if (selectedFile.type.startsWith('image/')) {
        // Image file
        const imageUrl = URL.createObjectURL(selectedFile);
        setImportPreview({ type: 'image', url: imageUrl });
      } else {
        // Other file types - just show the filename
        setImportPreview({ type: 'document', name: selectedFile.name });
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Error processing file");
    }
  };

  // Function to process the imported data
  const processImportedData = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }
    
    setUploading(true);
    setImportProgress(10);
    
    try {
      const contextData = {
        course: formData.course,
        year: formData.year,
        division: formData.division
      };
      
      setImportProgress(30);
      
      // Use the importTimetable function from FileImporter
      const result = await importTimetable(file, contextData);
      
      setImportProgress(100);
      toast.success(result.message);
    } catch (error) {
      console.error("Error importing timetable:", error);
      toast.error("Error importing timetable");
    } finally {
      setShowImportModal(false);
      setUploading(false);
      setFile(null);
      setImportPreview(null);
    }
  };

  // Function to trigger file input click
  const triggerFileInput = (type) => {
    setImportType(type);
    fileInputRef.current.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 relative overflow-hidden">
      <Toaster position="top-right" />
      <FacultyNavbar activeItem="academicCalendar" />
      
      {/* Background Elements */}
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
      
      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative z-10">
        {/* Page Header - More responsive layout with Division added */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 sm:h-6 w-5 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Academic Calendar</h1>
                <p className="text-white/70 text-sm">Manage class schedules and timetables</p>
              </div>
            </div>
            
            {/* Course/Year/Division Selection */}
            <div className="flex flex-wrap gap-3">
              <select
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                value={formData.course}
                className="bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm text-sm flex-grow sm:flex-grow-0"
              >
                {courses.map((course) => (
                  <option key={course} value={course} className="bg-gray-800">
                    {course}
                  </option>
                ))}
              </select>

              <select
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                value={formData.year}
                className="bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm text-sm flex-grow sm:flex-grow-0"
              >
                {years.map(year => (
                  <option key={year} value={year} className="bg-gray-800">{year}</option>
                ))}
              </select>

              {/* Add Division dropdown */}
              <select
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                value={formData.division}
                className="bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm text-sm flex-grow sm:flex-grow-0"
              >
                {divisions.map(division => (
                  <option key={division} value={division} className="bg-gray-800">Div {division}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-3 sm:p-6 overflow-hidden">
          <div className="relative">
            {/* Decorative Elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-xl"></div>
            
            {/* Responsive Timetable */}
            <div className="relative z-10 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr>
                    <th className="p-2 sm:p-3 text-left text-white/70 font-medium w-20 sm:w-32 min-w-20">Time</th>
                    {days.map(day => (
                      <th key={day} className="p-2 sm:p-3 text-left text-white/70 font-medium w-1/6">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot) => (
                    <tr key={timeSlot} className="border-t border-white/10">
                      <td className="p-2 sm:p-3 text-white/70 font-medium whitespace-nowrap text-xs sm:text-sm">
                        {timeSlot.replace('-', ' - ')}
                      </td>
                      {days.map(day => {
                        // Update key to include division
                        const key = `${formData.course}-${formData.year}-${formData.division}-${day}-${timeSlot.split('-')[0]}`;
                        const schedule = schedules[key];
                        return (
                          <td
                            key={`${day}-${timeSlot}`}
                            className="p-1 sm:p-3 w-1/6"
                            onClick={() => handleCellClick(day, timeSlot)}
                          >
                            <div className={`
                              h-16 sm:h-24 w-full rounded-xl transition-all duration-300 flex flex-col justify-center
                              ${schedule 
                                ? 'bg-blue-600/20 hover:bg-blue-600/30 border border-white/10 backdrop-blur-sm shadow-lg p-2 sm:p-4' 
                                : 'border border-white/10 hover:bg-white/5 flex items-center justify-center'
                              }
                            `}>
                              {schedule ? (
                                <>
                                  <p className="text-white text-xs sm:text-base font-medium line-clamp-1 mb-0 sm:mb-1">
                                    {schedule.subject}
                                  </p>
                                  <p className="text-white/70 text-xs line-clamp-1 hidden sm:block">
                                    {schedule.faculty}
                                  </p>
                                </>
                              ) : (
                                <span className="text-white/30 text-xs group-hover:text-white/50 transition-colors hidden sm:inline">
                                  Add Class
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile scroll indicator */}
            <div className="flex items-center justify-center mt-3 sm:hidden">
              <div className="flex items-center text-white/50 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>Swipe to see more</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal - Updated to include Division */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          
          <div className="relative z-10 max-w-md w-full mx-auto overflow-hidden">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden transition-all duration-300">
              {/* Modal Header */}
              <div className="relative h-20 sm:h-24 bg-gradient-to-r from-blue-700/80 to-indigo-800/80 p-4 sm:p-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-10"></div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/10 rounded-full"></div>
                
                <div className="relative z-10">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Add Schedule
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm mt-1">
                    {selectedCell.day} {selectedCell.timeSlot.replace('-', ' - ')}
                  </p>
                </div>
              </div>
              
              {/* Modal Form - Updated with Division */}
              <div className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Course, Year and Division fields */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-white text-xs mb-1">Course</label>
                      <select
                        value={formData.course}
                        onChange={e => setFormData({ ...formData, course: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      >
                        <option value="" disabled>Select Course</option>
                        {courses.map(course => (
                          <option key={course} value={course} className="bg-gray-800">{course}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white text-xs mb-1">Year</label>
                      <select
                        value={formData.year}
                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      >
                        <option value="" disabled>Select Year</option>
                        {years.map(year => (
                          <option key={year} value={year} className="bg-gray-800">{year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white text-xs mb-1">Division</label>
                      <select
                        value={formData.division}
                        onChange={e => setFormData({ ...formData, division: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      >
                        <option value="" disabled>Select Division</option>
                        {divisions.map(division => (
                          <option key={division} value={division} className="bg-gray-800">Div {division}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-white text-xs mb-1">Subject</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        placeholder="Enter subject name"
                        required
                      />
                    </div>
                  </div>

                  {/* Faculty */}
                  <div>
                    <label className="block text-white text-xs mb-1">Faculty Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={formData.faculty}
                        onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        placeholder="Enter faculty name"
                        required
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-3 sm:px-4 py-2 text-white hover:bg-white/10 rounded-xl transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:from-blue-500 hover:to-indigo-500 text-sm"
                    >
                      Add Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Card reflection effect */}
            <div className="mt-1 w-full h-8 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-sm"></div>
          </div>
        </div>
      )}
      
      {/* Import Timetable Modal */}
      {showImportModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
          
          <div className="relative z-10 max-w-2xl w-full mx-auto p-4">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden">
              {/* Modal Header */}
              <div className="relative h-20 sm:h-24 bg-gradient-to-r from-green-700/80 to-teal-800/80 p-4 sm:p-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-10"></div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/10 rounded-full"></div>
                
                <div className="relative z-10">
                  <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import Timetable
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm mt-1">
                    Upload a file to import schedule data
                  </p>
                </div>
              </div>
              
              {/* Import Options */}
              <div className="p-6">
                {!file ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <button
                        onClick={() => triggerFileInput('csv')}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col items-center transition-all hover:scale-105"
                      >
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-white text-sm">CSV File</span>
                        <span className="text-white/50 text-xs mt-1">.csv</span>
                      </button>
                      
                      <button
                        onClick={() => triggerFileInput('document')}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col items-center transition-all hover:scale-105"
                      >
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-white text-sm">Document</span>
                        <span className="text-white/50 text-xs mt-1">.pdf, .docx</span>
                      </button>
                      
                      <button
                        onClick={() => triggerFileInput('spreadsheet')}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col items-center transition-all hover:scale-105"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-white text-sm">Spreadsheet</span>
                        <span className="text-white/50 text-xs mt-1">.xlsx, .xls</span>
                      </button>
                      
                      <button
                        onClick={() => triggerFileInput('image')}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col items-center transition-all hover:scale-105"
                      >
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-white text-sm">Image</span>
                        <span className="text-white/50 text-xs mt-1">.jpg, .png</span>
                      </button>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-3 bg-[#1a2142] text-white/50 text-sm">or drag and drop</span>
                      </div>
                    </div>
                    
                    <div 
                      className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/40 transition-colors"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const droppedFile = e.dataTransfer.files[0];
                        if (droppedFile) {
                          fileInputRef.current.files = e.dataTransfer.files;
                          handleFileChange({ target: { files: e.dataTransfer.files } });
                        }
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      
                      <p className="text-white mt-4">Click on a format above or drop your file here</p>
                      <p className="text-sm text-white/50 mt-2">Supported formats: CSV, Spreadsheets, PDF, and Images</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* File Preview */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start">
                        {/* File type icon */}
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mr-4">
                          {importPreview?.type === 'csv' && (
                            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {importPreview?.type === 'excel' && (
                            <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )}
                          {importPreview?.type === 'pdf' && (
                            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )}
                          {importPreview?.type === 'image' && (
                            <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        
                        {/* File info */}
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{file.name}</h4>
                          <p className="text-white/50 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                        
                        {/* Remove button */}
                        <button 
                          onClick={() => {
                            setFile(null);
                            setImportPreview(null);
                          }}
                          className="text-white/50 hover:text-white"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Preview content */}
                      {importPreview?.type === 'csv' && (
                        <div className="mt-4 max-h-48 overflow-y-auto">
                          <table className="w-full text-white/90 text-xs">
                            <thead className="text-white/50 border-b border-white/10">
                              <tr>
                                {importPreview.data[0]?.map((header, idx) => (
                                  <th key={idx} className="px-2 py-1 text-left">{header}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {importPreview.data.slice(1, 10).map((row, rowIdx) => (
                                <tr key={rowIdx} className="border-b border-white/5">
                                  {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} className="px-2 py-1">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {importPreview.data.length > 10 && (
                            <p className="text-center text-white/40 text-xs mt-2">
                              + {importPreview.data.length - 10} more rows
                            </p>
                          )}
                        </div>
                      )}
                      
                      {importPreview?.type === 'excel' && (
                        <div className="mt-4 flex justify-center">
                          <p className="text-white/50 text-sm">Excel file preview not available</p>
                        </div>
                      )}
                      
                      {importPreview?.type === 'pdf' && (
                        <div className="mt-4 flex justify-center">
                          <p className="text-white/50 text-sm">PDF preview not available</p>
                        </div>
                      )}
                      
                      {importPreview?.type === 'image' && (
                        <div className="mt-4 flex justify-center">
                          <img 
                            src={importPreview.url} 
                            alt="Timetable" 
                            className="max-h-48 rounded-lg border border-white/10" 
                          />
                        </div>
                      )}
                      
                      {importPreview?.type === 'document' && (
                        <div className="mt-4 flex justify-center">
                          <p className="text-white/50 text-sm">Document preview not available</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Note about processing */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm text-white/80">
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p>When you import a file:</p>
                          <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                            <li>CSV files will be parsed to extract schedules</li>
                            <li>Excel and PDF files will be stored for reference</li>
                            <li>Processing may take a moment to complete</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 text-white hover:bg-white/10 rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processImportedData}
                    disabled={!file || uploading}
                    className={`px-6 py-2 rounded-xl transition-all text-sm flex items-center ${
                      !file || uploading 
                        ? 'bg-gray-600/50 text-white/50 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:shadow-lg hover:from-green-500 hover:to-teal-500'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Importing ({importProgress}%)
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import Timetable
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Card reflection effect */}
            <div className="mt-1 w-full h-8 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-sm"></div>
          </div>
        </div>
      )}
    </div>
  );
}