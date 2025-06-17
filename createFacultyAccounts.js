import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if serviceAccountKey.json exists
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: serviceAccountKey.json not found!');
  console.log('Please download your service account key from Firebase console:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log('2. Select your project');
  console.log('3. Go to Project settings > Service accounts');
  console.log('4. Click "Generate new private key"');
  console.log('5. Save the file as "serviceAccountKey.json" in the project root');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const app = initializeApp({
  credential: cert(serviceAccount)
});

// Get Auth and Firestore references
const auth = getAuth(app);
const db = getFirestore(app);

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
    
    // Check if user already exists
    try {
      const userRecord = await auth.getUserByEmail(faculty.email);
      console.log(`User ${faculty.email} already exists with UID: ${userRecord.uid}`);
      
      // Update Firestore document anyway
      const firstName = faculty.name.split(" ")[0].toLowerCase();
      const username = `${firstName}_faculty`;
      
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        username: username,
        name: faculty.name,
        email: faculty.email,
        mobile: faculty.mobile,
        department: faculty.department,
        facultyId: faculty.facultyId,
        role: "faculty",
        joinedAt: new Date()
      }, { merge: true });
      
      console.log(`Updated Firestore document for ${faculty.email}`);
      return userRecord.uid;
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      
      // User doesn't exist, create new user
      const userRecord = await auth.createUser({
        email: faculty.email,
        password: faculty.password,
        displayName: faculty.name
      });
      
      console.log(`Created new user: ${userRecord.uid}`);
      
      // Generate username from faculty name
      const firstName = faculty.name.split(" ")[0].toLowerCase();
      const username = `${firstName}_faculty`;
      
      // Create user document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        username: username,
        name: faculty.name,
        email: faculty.email,
        mobile: faculty.mobile,
        department: faculty.department,
        facultyId: faculty.facultyId,
        role: "faculty",
        joinedAt: new Date()
      });
      
      console.log(`Successfully created faculty account: ${faculty.email}`);
      return userRecord.uid;
    }
  } catch (error) {
    console.error(`Error creating faculty account for ${faculty.email}:`, error);
    return null;
  }
}

// Main function to create all faculty accounts
async function createAllFacultyAccounts() {
  console.log("Starting faculty account creation process...");
  
  for (const faculty of facultyAccounts) {
    await createFacultyAccount(faculty);
  }
  
  console.log("Faculty account creation process completed.");
  process.exit(0);
}

// Run the main function
createAllFacultyAccounts().catch((error) => {
  console.error("Error in faculty account creation:", error);
  process.exit(1);
});
