import { useLocation, useNavigate } from 'react-router';

/** Back to where the page was opened from; opened straight (a link from Google), to Pup Budget's start. */
export function useBack() {
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    if (location.key === 'default') void navigate('/sign-in');
    else void navigate(-1);
  };
}
