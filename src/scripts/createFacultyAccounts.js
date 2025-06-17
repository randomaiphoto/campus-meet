import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

/**
 * Script to create faculty accounts
 * 
 * HOW TO USE:
 * 1. Import this script in your browser console or a temporary component
 * 2. Run the createFacultyAccounts() function
 * 3. Check the console for results
 */

// Faculty account data to create
const facultyAccounts = [
  {
    email: "ujwala@gmail.com",
    password: "ujwala@123",
    name: "Ujwala Sharma",
    department: "Computer Science",
    facultyId: "FAC-CS-001",
    mobile: "9876543210"
  },
  {
    email: "archana@gmail.com",
    password: "archana@123",
    name: "Archana Patel",
    department: "Business Administration",
    facultyId: "FAC-BA-002",
    mobile: "9876543211"
  }
];

// Function to create a single faculty account
async function createFacultyAccount(faculty) {
  try {
    console.log(`Creating account for ${faculty.email}...`);
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      faculty.email, 
      faculty.password
    );
    
    const user = userCredential.user;
    
    // Generate username from faculty name
    const firstName = faculty.name.split(" ")[0].toLowerCase();
    const username = `${firstName}_faculty`;
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      username: username,
      name: faculty.name,
      email: faculty.email,
      mobile: faculty.mobile,
      department: faculty.department,
      facultyId: faculty.facultyId,
      role: "faculty",
      joinedAt: serverTimestamp()
    });
    
    console.log(`Successfully created faculty account: ${faculty.email}`);
    return true;
  } catch (error) {
    console.error(`Error creating faculty account for ${faculty.email}:`, error);
    return false;
  }
}

// Function to create all faculty accounts
export async function createFacultyAccounts() {
  console.log("Starting faculty account creation process...");
  
  for (const faculty of facultyAccounts) {
    await createFacultyAccount(faculty);
  }
  
  console.log("Faculty account creation process completed.");
}

// Export individual function for potential programmatic use
export { createFacultyAccount };

// For direct execution in browser console
if (typeof window !== 'undefined') {
  window.createFacultyAccounts = createFacultyAccounts;
}
