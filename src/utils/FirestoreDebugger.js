import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Checks if Firestore connection is working by attempting to read data
 * @returns {Promise<boolean>} True if connection works, false otherwise
 */
export const testFirestoreRead = async () => {
  try {
    console.log("Testing Firestore read operation...");
    const testCollection = collection(db, "test_collection");
    const snapshot = await getDocs(testCollection);
    console.log(`Read successful. Found ${snapshot.size} documents.`);
    return true;
  } catch (error) {
    console.error("Firestore read test failed:", error);
    return false;
  }
};

/**
 * Checks if Firestore connection is working by attempting to write data
 * @returns {Promise<boolean>} True if connection works, false otherwise
 */
export const testFirestoreWrite = async () => {
  try {
    console.log("Testing Firestore write operation...");
    const testCollection = collection(db, "test_collection");
    const docRef = await addDoc(testCollection, {
      message: "Test message",
      timestamp: serverTimestamp()
    });
    console.log("Write successful. Document ID:", docRef.id);
    return true;
  } catch (error) {
    console.error("Firestore write test failed:", error);
    return false;
  }
};

/**
 * Workarounds for common Firestore connection issues
 */
export const troubleshootFirestore = () => {
  return {
    // Check if the page is using HTTPS
    isHttps: window.location.protocol === "https:",
    
    // Check if third-party cookies are blocked
    checkCookies: () => {
      try {
        document.cookie = "testcookie=1";
        return document.cookie.indexOf("testcookie=") !== -1;
      } catch (e) {
        return false;
      }
    },
    
    // Return browser details
    browserInfo: {
      userAgent: navigator.userAgent,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack
    },
    
    // Common solutions to try
    solutions: [
      "Disable ad blockers and privacy extensions",
      "Try incognito/private mode",
      "Allow third-party cookies in browser settings",
      "Add localhost exception in browser security settings",
      "Try a different browser",
      "Check firewall settings"
    ]
  };
};
