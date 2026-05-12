import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusinessState] = useState(null);

  // Sync activeBusiness to localStorage so api.js interceptor can read it
  const setActiveBusiness = useCallback((biz) => {
    setActiveBusinessState(biz);
    if (biz) {
      localStorage.setItem('activeBusinessId', biz._id);
    } else {
      localStorage.removeItem('activeBusinessId');
    }
  }, []);

  const fetchBusinesses = useCallback(async () => {
    try {
      const { data } = await api.get('/businesses');
      setBusinesses(data);
      // Auto-select first business if none is active
      if (data.length > 0 && !activeBusiness) {
        setActiveBusiness(data[0]);
      }
    } catch {
      // Non-fatal — user may not have businesses yet
      setBusinesses([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/profile');
          setUser(data);
          await fetchBusinesses();
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data);
      // Fetch businesses after login
      try {
        const bizRes = await api.get('/businesses');
        setBusinesses(bizRes.data);
        if (bizRes.data.length > 0) {
          setActiveBusiness(bizRes.data[0]);
        }
      } catch {
        setBusinesses([]);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeBusinessId');
    setUser(null);
    setBusinesses([]);
    setActiveBusinessState(null);
  };

  const signup = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      localStorage.setItem('token', data.token);
      setUser(data);
      // Fetch businesses (likely empty, but good to init)
      await fetchBusinesses();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Signup failed' };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      signup,
      updateUser,
      loading,
      businesses,
      setBusinesses,
      activeBusiness,
      setActiveBusiness,
      fetchBusinesses,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
