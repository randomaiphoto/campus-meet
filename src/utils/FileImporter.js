import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Storage reference
const storage = getStorage();

/**
 * Uploads a file to Firebase Storage and creates a reference in Firestore
 * @param {File} file The file to upload
 * @param {Object} metadata Additional metadata about the file
 * @returns {Promise<string>} URL of the uploaded file
 */
export const uploadFile = async (file, metadata = {}) => {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    
    // Create a reference to the file in Firebase Storage
    const fileRef = ref(storage, `uploads/${filename}`);
    
    // Upload the file
    await uploadBytes(fileRef, file);
    
    // Get the download URL for the file
    const downloadURL = await getDownloadURL(fileRef);
    
    // Add metadata to Firestore
    await addDoc(collection(db, "uploads"), {
      filename: file.name,
      fileURL: downloadURL,
      type: file.type,
      size: file.size,
      metadata,
      uploadedAt: serverTimestamp()
    });
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

/**
 * Imports timetable data from a file
 * @param {File} file The file to import
 * @param {Object} contextData Additional data about the timetable 
 * @returns {Promise<Object>} Information about the import process
 */
export const importTimetable = async (file, contextData) => {
  if (!file) {
    throw new Error("No file provided");
  }
  
  try {
    // Upload the file to Firebase Storage
    const fileUrl = await uploadFile(file, {
      importType: "timetable",
      ...contextData
    });
    
    // Create a record in timetableImports collection
    const importRecord = await addDoc(collection(db, "timetableImports"), {
      course: contextData.course,
      year: contextData.year,
      division: contextData.division,
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      importedAt: serverTimestamp(),
      status: "pending_processing" // Would be processed by a separate function
    });
    
    return {
      success: true,
      importId: importRecord.id,
      fileUrl,
      message: "Timetable file uploaded successfully! It will be processed shortly."
    };
  } catch (error) {
    console.error("Error importing timetable:", error);
    throw error;
  }
};

/**
 * Process a file and extract its content as text
 * @param {File} file The file to process
 * @returns {Promise<string>} File content as text
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

/**
 * Simple parser that extracts data from CSV text format
 * @param {string} csvText The CSV content as text
 * @returns {Array} Parsed data as array of objects
 */
export const parseCSV = (csvText) => {
  try {
    const lines = csvText.split("\n");
    const headers = lines[0].split(",").map(header => header.trim());
    
    const results = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(",").map(val => val.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      
      results.push(row);
    }
    
    return results;
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw error;
  }
};
