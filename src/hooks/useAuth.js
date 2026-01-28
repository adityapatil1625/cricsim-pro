/**
 * @hook useAuth - Firebase authentication state management
 * @description Provides current user, loading state, and auth status
 * @example
 * const { user, loading, isAuthenticated } = useAuth();
 */

import { useState, useEffect } from 'react';
import authService from '../services/authService';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set up real-time auth state listener
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setError(null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe?.();
  }, []);

  const isAuthenticated = !!user;

  return {
    user,
    loading,
    error,
    isAuthenticated,
  };
};

export default useAuth;
