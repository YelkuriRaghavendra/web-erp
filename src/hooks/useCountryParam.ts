import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function useCountryParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userInfo } = useAuthStore();

  useEffect(() => {
    const currentCountry = searchParams.get('country');
    const defaultCountry = userInfo?.default_country || 'AG';

    if (!currentCountry) {
      searchParams.set('country', defaultCountry);
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, userInfo]);

  return searchParams.get('country');
}
