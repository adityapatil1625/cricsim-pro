/**
 * @fileoverview Firebase authentication service
 * @module authService
 * @description Handles user signup, login, logout, and auth state management
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Sign up new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password (6+ chars)
 * @param {string} displayName - User display name
 * @returns {Promise} User object with uid
 * @throws {Error} Firebase auth error
 * 
 * @example
 * const user = await authService.signup('user@example.com', 'password123', 'John Doe');
 */
export const signup = async (email, password, displayName) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        matchesPlayed: 0,
        tournamentsParticipated: 0,
        totalWins: 0,
      },
    });

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Sign in existing user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} User object with uid
 * @throws {Error} Firebase auth error
 * 
 * @example
 * const user = await authService.login('user@example.com', 'password123');
 */
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Sign out current user
 * @returns {Promise} Void
 * 
 * @example
 * await authService.logout();
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Get current authenticated user
 * @returns {Promise} User object or null if not authenticated
 * 
 * @example
 * const user = await authService.getCurrentUser();
 */
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

/**
 * Listen to auth state changes in real-time
 * @param {Function} callback - Called with user object when auth state changes
 * @returns {Function} Unsubscribe function
 * 
 * @example
 * const unsubscribe = authService.onAuthStateChange((user) => {
 *   console.log('Auth state changed:', user);
 * });
 * 
 * // Later: unsubscribe();
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get user profile from Firestore
 * @param {string} uid - User ID
 * @returns {Promise} User profile object
 * 
 * @example
 * const profile = await authService.getUserProfile('user-123');
 */
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Update user stats (wins, matches played, etc.)
 * @param {string} uid - User ID
 * @param {Object} updates - Stats to update
 * @returns {Promise} Void
 * 
 * @example
 * await authService.updateUserStats('user-123', {
 *   matchesPlayed: 10,
 *   totalWins: 5
 * });
 */
export const updateUserStats = async (uid, updates) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      stats: updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

export default {
  signup,
  login,
  logout,
  getCurrentUser,
  onAuthStateChange,
  getUserProfile,
  updateUserStats,
};
