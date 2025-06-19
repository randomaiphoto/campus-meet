import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { getClassesForFacultyCoordinator } from '../utils/facultyCoordinatorUtils';
import './TimetableManager.css';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

function TimetableManager() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [timetable, setTimetable] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState({
    name: '',
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    teacher: ''
  });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareURL, setShareURL] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const timetableRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAssignedClasses();
  }, [currentUser]);

  useEffect(() => {
    if (selectedClass) {
      fetchSubjectsForClass(selectedClass.course, selectedClass.year, selectedClass.division);
    }
  }, [selectedClass]);

  const fetchAssignedClasses = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const coordinatedClasses = await getClassesForFacultyCoordinator(currentUser.uid);
      
      setAssignedClasses(coordinatedClasses);
      
      if (coordinatedClasses.length === 1) {
        setSelectedClass(coordinatedClasses[0]);
      }
      
    } catch (error) {
      console.error("Error fetching assigned classes:", error);
      setError("Failed to load your assigned classes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsForClass = async (course, year, division) => {
    try {
      setLoading(true);
      
      const subjectsQuery = query(
        collection(db, 'subjects'),
        where('course', '==', course),
        where('year', '==', year),
        where('division', '==', division)
      );
      
      const querySnapshot = await getDocs(subjectsQuery);
      
      const subjectsData = [];
      querySnapshot.forEach((doc) => {
        subjectsData.push({ id: doc.id, ...doc.data() });
      });
      
      setSubjects(subjectsData);
      
      organizeSubjectsIntoTimetable(subjectsData);
      
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setError("Failed to load timetable data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const organizeSubjectsIntoTimetable = (subjectsData) => {
    const newTimetable = {};
    
    DAYS_OF_WEEK.forEach(day => {
      newTimetable[day] = {};
      TIME_SLOTS.forEach(time => {
        newTimetable[day][time] = null;
      });
    });
    
    subjectsData.forEach(subject => {
      if (subject.day && subject.startTime) {
        const startTimeIndex = TIME_SLOTS.indexOf(subject.startTime);
        const endTimeIndex = subject.endTime ? TIME_SLOTS.indexOf(subject.endTime) : startTimeIndex + 1;
        
        if (startTimeIndex >= 0) {
          for (let i = startTimeIndex; i < endTimeIndex && i < TIME_SLOTS.length; i++) {
            const timeSlot = TIME_SLOTS[i];
            if (i === startTimeIndex) {
              newTimetable[subject.day][timeSlot] = {
                ...subject,
                isMultiHour: endTimeIndex - startTimeIndex > 1,
                isFirstHour: true,
                totalHours: endTimeIndex - startTimeIndex
              };
            } else {
              newTimetable[subject.day][timeSlot] = {
                id: subject.id,
                name: subject.name,
                isMultiHour: true,
                isFirstHour: false,
                refersTo: subject.startTime
              };
            }
          }
        }
      }
    });
    
    setTimetable(newTimetable);
  };

  const handleSubjectClick = (subject) => {
    if (!subject || !subject.isFirstHour) return;
    
    setCurrentSubject({
      id: subject.id,
      name: subject.name,
      day: subject.day,
      startTime: subject.startTime,
      endTime: subject.endTime,
      teacher: subject.teacher || ''
    });
    
    setEditMode(true);
    setSubjectDialogOpen(true);
  };

  const handleAddSubject = (day, timeSlot) => {
    if (timetable[day][timeSlot]) return;
    
    const startIndex = TIME_SLOTS.indexOf(timeSlot);
    const endTime = startIndex < TIME_SLOTS.length - 1 ? TIME_SLOTS[startIndex + 1] : timeSlot;
    
    setCurrentSubject({
      name: '',
      day: day,
      startTime: timeSlot,
      endTime: endTime,
      teacher: ''
    });
    
    setEditMode(false);
    setSubjectDialogOpen(true);
  };

  const handleCloseSubjectDialog = () => {
    setSubjectDialogOpen(false);
  };

  const handleSubjectChange = (e) => {
    const { name, value } = e.target;
    setCurrentSubject({
      ...currentSubject,
      [name]: value
    });
  };

  const validateSubjectForm = () => {
    if (!currentSubject.name || !currentSubject.day || !currentSubject.startTime || !currentSubject.endTime) {
      return false;
    }
    
    const startIndex = TIME_SLOTS.indexOf(currentSubject.startTime);
    const endIndex = TIME_SLOTS.indexOf(currentSubject.endTime);
    
    if (startIndex >= endIndex) {
      return false;
    }
    
    return true;
  };

  const handleSubjectSave = async () => {
    if (!validateSubjectForm()) {
      setError("Please complete all fields and ensure end time is after start time.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const subjectData = {
        name: currentSubject.name,
        course: selectedClass.course,
        year: selectedClass.year,
        division: selectedClass.division,
        day: currentSubject.day,
        startTime: currentSubject.startTime,
        endTime: currentSubject.endTime,
        teacher: currentSubject.teacher,
        updatedAt: new Date().toISOString()
      };
      
      if (editMode && currentSubject.id) {
        await updateDoc(doc(db, 'subjects', currentSubject.id), subjectData);
      } else {
        subjectData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'subjects'), subjectData);
      }
      
      await fetchSubjectsForClass(selectedClass.course, selectedClass.year, selectedClass.division);
      
      setSubjectDialogOpen(false);
      
    } catch (error) {
      console.error("Error saving subject:", error);
      setError("Failed to save subject. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectDelete = async () => {
    if (!editMode || !currentSubject.id) return;
    
    if (!window.confirm("Are you sure you want to delete this subject?")) {
      return;
    }
    
    try {
      setLoading(true);
      
      await deleteDoc(doc(db, 'subjects', currentSubject.id));
      
      await fetchSubjectsForClass(selectedClass.course, selectedClass.year, selectedClass.division);
      
      setSubjectDialogOpen(false);
      
    } catch (error) {
      console.error("Error deleting subject:", error);
      setError("Failed to delete subject. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTimetable = () => {
    const printContent = document.getElementById('printable-timetable');
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 20px;">
        <h1 style="text-align: center; margin-bottom: 20px;">
          ${selectedClass.course} Year ${selectedClass.year} Division ${selectedClass.division} Timetable
        </h1>
        ${printContent.outerHTML}
      </div>
    `;

    window.print();
    document.body.innerHTML = originalContents;
    
    window.location.reload();
  };

  const handleExportTimetable = () => {
    try {
      const exportData = {
        metadata: {
          course: selectedClass.course,
          year: selectedClass.year,
          division: selectedClass.division,
          exportDate: new Date().toISOString(),
          exportedBy: currentUser?.displayName || 'Faculty'
        },
        subjects: subjects
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable_${selectedClass.course}_${selectedClass.year}_${selectedClass.division}.json`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
      
      if (window.showToast) {
        window.showToast('Timetable exported successfully!', 'success');
      }
    } catch (error) {
      console.error("Error exporting timetable:", error);
      if (window.showToast) {
        window.showToast('Failed to export timetable', 'error');
      }
    }
  };

  const handleImportTimetable = () => {
    fileInputRef.current.click();
  };

  const processImportedFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (!importData.subjects || !Array.isArray(importData.subjects)) {
            throw new Error('Invalid timetable data format');
          }
          
          if (!importData.metadata || 
              !importData.metadata.course || 
              !importData.metadata.year || 
              !importData.metadata.division) {
            throw new Error('Missing timetable metadata');
          }
          
          if (selectedClass.course !== importData.metadata.course ||
              selectedClass.year !== importData.metadata.year ||
              selectedClass.division !== importData.metadata.division) {
            
            if (!window.confirm(
              `The imported timetable is for ${importData.metadata.course} Year ${importData.metadata.year} Div ${importData.metadata.division}, but you have selected ${selectedClass.course} Year ${selectedClass.year} Div ${selectedClass.division}. Continue anyway?`
            )) {
              return;
            }
          }
          
          setLoading(true);
          
          for (const subject of subjects) {
            await deleteDoc(doc(db, 'subjects', subject.id));
          }
          
          for (const subject of importData.subjects) {
            const newSubject = {
              name: subject.name,
              course: selectedClass.course,
              year: selectedClass.year, 
              division: selectedClass.division,
              day: subject.day,
              startTime: subject.startTime,
              endTime: subject.endTime,
              teacher: subject.teacher || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            await addDoc(collection(db, 'subjects'), newSubject);
          }
          
          await fetchSubjectsForClass(selectedClass.course, selectedClass.year, selectedClass.division);
          
          if (window.showToast) {
            window.showToast('Timetable imported successfully!', 'success');
          }
        } catch (error) {
          console.error("Error processing imported file:", error);
          if (window.showToast) {
            window.showToast(`Import failed: ${error.message}`, 'error');
          }
        } finally {
          setLoading(false);
          event.target.value = '';
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing timetable:", error);
      if (window.showToast) {
        window.showToast('Failed to import timetable', 'error');
      }
    }
  };

  const handleShareTimetable = () => {
    try {
      const shareData = {
        metadata: {
          course: selectedClass.course,
          year: selectedClass.year,
          division: selectedClass.division,
          sharedAt: new Date().toISOString(),
          sharedBy: currentUser?.displayName || 'Faculty'
        },
        subjects: subjects
      };
      
      const jsonString = JSON.stringify(shareData);
      const encodedData = btoa(encodeURIComponent(jsonString));
      
      const baseUrl = window.location.origin;
      const shareableUrl = `${baseUrl}/?sharedTimetable=${encodedData}`;
      
      setShareURL(shareableUrl);
      setShareDialogOpen(true);
      setShareSuccess(false);
    } catch (error) {
      console.error("Error sharing timetable:", error);
      if (window.showToast) {
        window.showToast('Failed to generate shareable link', 'error');
      }
    }
  };

  const handleCopyShareLink = () => {
    try {
      navigator.clipboard.writeText(shareURL);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
  };

  // Import timetable data for BCA 2nd year div B
  const importBCA2BData = async () => {
    if (!selectedClass || selectedClass.course !== "BCA" || 
        selectedClass.year !== "2" || selectedClass.division !== "B") {
      if (window.showToast) {
        window.showToast('Please select BCA Year 2 Division B first', 'warning');
      }
      return;
    }

    // Confirm before replacing existing data
    if (!window.confirm('This will replace all existing timetable data for BCA 2nd Year Division B. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // First, delete existing subjects for this class
      for (const subject of subjects) {
        await deleteDoc(doc(db, 'subjects', subject.id));
      }
      
      // Map days to the format expected by the database
      const dayMapping = {
        'MON': 'Monday',
        'TUE': 'Tuesday',
        'WED': 'Wednesday',
        'THU': 'Thursday',
        'FRI': 'Friday',
        'SAT': 'Saturday'
      };
      
      // Map time slots to the format expected by the database
      const timeMapping = {
        '8:00-9:00': { start: '08:00', end: '09:00' },
        '10.00 am-11.00 am': { start: '10:00', end: '11:00' },
        '11.00 am-12.00 am': { start: '11:00', end: '12:00' },
        '12.00 am-1.00 pm': { start: '12:00', end: '13:00' },
        '1.00 pm-2.00 pm': { start: '13:00', end: '14:00' },
        '2.00 pm-3.00 pm': { start: '14:00', end: '15:00' },
        '3.00 pm-4.00 pm': { start: '15:00', end: '16:00' },
        '4.00 pm-5.00 pm': { start: '16:00', end: '17:00' }
      };
      
      // Define the BCA 2nd year div B timetable data
      const timetableData = [
        // Monday
        { day: 'MON', time: '10.00 am-11.00 am', subject: 'AJ', teacher: 'Prof. Vindhya' },
        { day: 'MON', time: '11.00 am-12.00 am', subject: 'OT', teacher: 'Prof. Anand' },
        { day: 'MON', time: '12.00 am-1.00 pm', subject: 'CN', teacher: 'Prof. Reema' },
        { day: 'MON', time: '2.00 pm-3.00 pm', subject: 'Mathematical Aptitude', teacher: 'Prof. Sridhar' },
        { day: 'MON', time: '3.00 pm-4.00 pm', subject: 'Mathematical Aptitude', teacher: 'Prof. Sridhar' },
        
        // Tuesday
        { day: 'TUE', time: '8:00-9:00', subject: 'CS', teacher: 'Prof. Sabitha' },
        { day: 'TUE', time: '10.00 am-11.00 am', subject: 'AJ', teacher: 'Prof. Vindhya' },
        { day: 'TUE', time: '11.00 am-12.00 am', subject: 'OT', teacher: 'Prof. Anand' },
        { day: 'TUE', time: '12.00 am-1.00 pm', subject: 'CN', teacher: 'Prof. Reema' },
        
        // Wednesday
        { day: 'WED', time: '8:00-9:00', subject: 'CS', teacher: 'Prof. Sabitha' },
        { day: 'WED', time: '12.00 am-1.00 pm', subject: 'AHJS', teacher: 'Prof. Thomas' },
        { day: 'WED', time: '1.00 pm-2.00 pm', subject: 'CN', teacher: 'Prof. Reema' },
        
        // Thursday
        { day: 'THU', time: '12.00 am-1.00 pm', subject: 'AHJS', teacher: 'Prof. Thomas' },
        { day: 'THU', time: '1.00 pm-2.00 pm', subject: 'AJ', teacher: 'Prof. Vindhya' },
        { day: 'THU', time: '2.00 pm-4.00 pm', subject: 'AJ/HTML Lab', teacher: 'Prof. Vindhya', duration: 2 },
        
        // Friday
        { day: 'FRI', time: '11.00 am-12.00 am', subject: 'OT', teacher: 'Prof. Anand' },
        { day: 'FRI', time: '12.00 am-1.00 pm', subject: 'AHJS', teacher: 'Prof. Thomas' },
        { day: 'FRI', time: '1.00 pm-3.00 pm', subject: 'AJ/HTML Lab', teacher: 'Prof. Vindhya', duration: 2 }
      ];
      
      // Add each subject to the database
      for (const entry of timetableData) {
        const mappedDay = dayMapping[entry.day];
        const timeSlot = timeMapping[entry.time];
        
        if (!mappedDay || !timeSlot) {
          console.error(`Invalid day or time mapping: ${entry.day} - ${entry.time}`);
          continue;
        }
        
        // Handle multi-hour subjects
        let endTime = timeSlot.end;
        if (entry.duration && entry.duration > 1) {
          // Calculate the end time based on duration
          const startIndex = TIME_SLOTS.indexOf(timeSlot.start);
          if (startIndex >= 0 && startIndex + entry.duration < TIME_SLOTS.length) {
            endTime = TIME_SLOTS[startIndex + entry.duration];
          }
        }
        
        const subjectData = {
          name: entry.subject,
          course: selectedClass.course,
          year: selectedClass.year,
          division: selectedClass.division,
          day: mappedDay,
          startTime: timeSlot.start,
          endTime: endTime,
          teacher: entry.teacher || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await addDoc(collection(db, 'subjects'), subjectData);
      }
      
      // Refresh the timetable
      await fetchSubjectsForClass(selectedClass.course, selectedClass.year, selectedClass.division);
      
      if (window.showToast) {
        window.showToast('BCA 2nd Year Div B timetable imported successfully!', 'success');
      }
      
    } catch (error) {
      console.error("Error importing BCA 2B timetable:", error);
      setError("Failed to import timetable. Please try again.");
      if (window.showToast) {
        window.showToast('Failed to import timetable', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedClass) {
    return <div className="loading">Loading your classes...</div>;
  }

  return (
    <div className="timetable-manager">
      <div className="timetable-header">
        <h2>Timetable Management</h2>
        
        {assignedClasses.length === 0 ? (
          <div className="no-classes-message">
            <p>You are not assigned as a coordinator for any classes yet.</p>
          </div>
        ) : (
          <div className="class-selector">
            <label htmlFor="class-select">Select Class:</label>
            <select 
              id="class-select" 
              value={selectedClass ? `${selectedClass.course}_${selectedClass.year}_${selectedClass.division}` : ""}
              onChange={(e) => {
                const selected = assignedClasses.find(c => 
                  `${c.course}_${c.year}_${c.division}` === e.target.value
                );
                setSelectedClass(selected);
              }}
            >
              <option value="">Select a class</option>
              {assignedClasses.map(cls => (
                <option 
                  key={`${cls.course}_${cls.year}_${cls.division}`}
                  value={`${cls.course}_${cls.year}_${cls.division}`}
                >
                  {cls.course} Year {cls.year} Division {cls.division}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {selectedClass && (
        <div className="timetable-section">
          <div className="timetable-title">
            <h3>{selectedClass.course} Year {selectedClass.year} Division {selectedClass.division} Timetable</h3>
            <span className="timetable-info">Click on a time slot to add a subject or click on a subject to edit it</span>
          </div>
          
          <div className="timetable-actions">
            <button className="action-button print-button" onClick={handlePrintTimetable}>
              <i className="fas fa-print"></i> Print
            </button>
            <button className="action-button export-button" onClick={handleExportTimetable}>
              <i className="fas fa-file-export"></i> Export
            </button>
            <button className="action-button import-button" onClick={handleImportTimetable}>
              <i className="fas fa-file-import"></i> Import
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }}
              accept=".json"
              onChange={processImportedFile}
            />
            <button className="action-button share-button" onClick={handleShareTimetable}>
              <i className="fas fa-share-alt"></i> Share
            </button>
            {selectedClass && selectedClass.course === "BCA" && 
             selectedClass.year === "2" && selectedClass.division === "B" && (
              <button className="action-button bca2b-button" onClick={importBCA2BData}>
                <i className="fas fa-calendar-plus"></i> Import BCA 2B Default
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="loading">Loading timetable...</div>
          ) : (
            <div className="timetable" id="printable-timetable" ref={timetableRef}>
              <div className="timetable-header-row">
                <div className="time-label-cell">Time / Day</div>
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="day-header-cell">{day}</div>
                ))}
              </div>
              
              {TIME_SLOTS.map((timeSlot, index) => {
                if (index === TIME_SLOTS.length - 1) return null;
                
                const nextTimeSlot = TIME_SLOTS[index + 1];
                const timeDisplay = `${timeSlot} - ${nextTimeSlot}`;
                
                return (
                  <div key={timeSlot} className="timetable-row">
                    <div className="time-cell">{timeDisplay}</div>
                    
                    {DAYS_OF_WEEK.map(day => {
                      const subject = timetable[day]?.[timeSlot];
                      
                      if (!subject) {
                        return (
                          <div 
                            key={`${day}-${timeSlot}`} 
                            className="timetable-cell empty"
                            onClick={() => handleAddSubject(day, timeSlot)}
                          >
                            <div className="add-subject-icon">+</div>
                          </div>
                        );
                      } else if (subject.isFirstHour) {
                        let cellClass = "timetable-cell subject";
                        if (subject.isMultiHour) {
                          cellClass += " multi-hour";
                          cellClass += ` hours-${subject.totalHours}`;
                        }
                        
                        return (
                          <div 
                            key={`${day}-${timeSlot}`} 
                            className={cellClass}
                            onClick={() => handleSubjectClick(subject)}
                          >
                            <div className="subject-name">{subject.name}</div>
                            <div className="subject-teacher">{subject.teacher}</div>
                          </div>
                        );
                      } else if (subject.isMultiHour && !subject.isFirstHour) {
                        return (
                          <div 
                            key={`${day}-${timeSlot}`} 
                            className="timetable-cell continuation"
                          ></div>
                        );
                      }
                      
                      return (
                        <div 
                          key={`${day}-${timeSlot}`} 
                          className="timetable-cell empty"
                          onClick={() => handleAddSubject(day, timeSlot)}
                        >
                          <div className="add-subject-icon">+</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {subjectDialogOpen && (
        <div className="subject-dialog-overlay">
          <div className="subject-dialog">
            <div className="dialog-header">
              <h3>{editMode ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button className="close-button" onClick={handleCloseSubjectDialog}>×</button>
            </div>
            
            <div className="dialog-content">
              <div className="form-group">
                <label htmlFor="subject-name">Subject Name:</label>
                <input 
                  id="subject-name"
                  type="text"
                  name="name"
                  value={currentSubject.name}
                  onChange={handleSubjectChange}
                  placeholder="E.g., Advanced Java"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject-teacher">Teacher:</label>
                <input 
                  id="subject-teacher"
                  type="text"
                  name="teacher"
                  value={currentSubject.teacher}
                  onChange={handleSubjectChange}
                  placeholder="E.g., Prof. Smith"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subject-day">Day:</label>
                  <select
                    id="subject-day"
                    name="day"
                    value={currentSubject.day}
                    onChange={handleSubjectChange}
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject-start-time">Start Time:</label>
                  <select
                    id="subject-start-time"
                    name="startTime"
                    value={currentSubject.startTime}
                    onChange={handleSubjectChange}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject-end-time">End Time:</label>
                  <select
                    id="subject-end-time"
                    name="endTime"
                    value={currentSubject.endTime}
                    onChange={handleSubjectChange}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="dialog-actions">
              {editMode && (
                <button className="delete-button" onClick={handleSubjectDelete}>
                  Delete
                </button>
              )}
              <button className="cancel-button" onClick={handleCloseSubjectDialog}>
                Cancel
              </button>
              <button 
                className="save-button" 
                onClick={handleSubjectSave}
                disabled={loading || !validateSubjectForm()}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {shareDialogOpen && (
        <div className="share-dialog-overlay">
          <div className="share-dialog">
            <div className="dialog-header">
              <h3>Share Timetable</h3>
              <button className="close-button" onClick={handleCloseShareDialog}>×</button>
            </div>
            
            <div className="dialog-content">
              <p>Share this link to allow others to view this timetable:</p>
              
              <div className="share-url-container">
                <input 
                  type="text" 
                  className="share-url-input"
                  value={shareURL}
                  readOnly
                />
                <button 
                  className="copy-button"
                  onClick={handleCopyShareLink}
                >
                  {shareSuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              
              <div className="share-options">
                <p>Or share directly:</p>
                <div className="share-buttons">
                  <button 
                    className="share-button whatsapp"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this timetable: ${shareURL}`)}`, '_blank')}
                  >
                    <i className="fab fa-whatsapp"></i> WhatsApp
                  </button>
                  <button 
                    className="share-button email"
                    onClick={() => window.open(`mailto:?subject=Class Timetable&body=${encodeURIComponent(`Check out this timetable: ${shareURL}`)}`, '_blank')}
                  >
                    <i className="far fa-envelope"></i> Email
                  </button>
                </div>
              </div>
            </div>
            
            <div className="dialog-actions">
              <button className="close-button" onClick={handleCloseShareDialog}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimetableManager;