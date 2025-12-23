import { useAuth as useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const auth = useAuthContext();
  
  const getToken = async () => {
    return localStorage.getItem('token');
  };

  return {
    ...auth,
    getToken,
    isSignedIn: !!auth.user,
    user: auth.user
  };
};