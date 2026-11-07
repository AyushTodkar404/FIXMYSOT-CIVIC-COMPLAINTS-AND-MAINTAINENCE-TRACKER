import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/login');
          return;
        }

        const { data } = await axios.post(
          `${BACKEND_URL}/api/auth/google-session`,
          {},
          {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true
          }
        );

        const dashboard = data.role === 'admin'
          ? '/admin/dashboard'
          : data.role === 'municipal'
            ? '/municipal/dashboard'
            : '/citizen/dashboard';
        // Store the authenticated user in context before rendering a protected route.
        await refreshUser();
        navigate(dashboard, { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    processSession();
  }, [navigate, BACKEND_URL, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-800 mx-auto"></div>
        <p className="mt-4 text-stone-600">Completing sign in...</p>
      </div>
    </div>
  );
};
