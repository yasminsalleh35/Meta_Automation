import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TrialStarted = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard without showing trial message
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return null;
};

export default TrialStarted;
