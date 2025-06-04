import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const [countdown, setCountdown] = useState(5);
  const [isCleared, setIsCleared] = useState(false);

  useEffect(() => {
    // Clear tokens immediately when component mounts
    if (!isCleared) {
      clearTokens();
      setIsCleared(true);
    }

    let timer: number;
    
    const startCountdown = () => {
      timer = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/', { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    startCountdown();

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [navigate, clearTokens, isCleared]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Successfully Logged Out</h1>
        <p className="text-gray-400 text-lg">
          Redirecting to login page in {countdown} seconds...
        </p>
      </div>
    </div>
  );
};

export default Logout; 