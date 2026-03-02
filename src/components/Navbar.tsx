import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Globe, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { queryClient } from '@/lib/react-query';
import { countryLabels } from '@/lib/config';
import { useCountryParam } from '@/hooks/useCountryParam';

const Navbar = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { userInfo } = useAuthStore();
  const currentCountry = useCountryParam();

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  // Sync selectedCountry with URL parameter
  useEffect(() => {

    const storedCountry = localStorage.getItem('selectedCountry');
    if (storedCountry) {
      setSelectedCountry(storedCountry);
    } else if (currentCountry) {
      setSelectedCountry(currentCountry);
    }
  }, [currentCountry]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    localStorage.setItem('selectedCountry', country);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('country', country);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
    queryClient.invalidateQueries();
  };

  const languages = [
    { value: 'es-CL', label: 'Espanol (Chile)' },
    { value: 'en-US', label: 'English (US)' },
  ];

  let countryAccess: string[] = [];
  if (userInfo?.country_access) {
    if (typeof userInfo.country_access === 'string') {
      try {
        countryAccess = JSON.parse(userInfo.country_access);
      } catch {
        countryAccess = [userInfo.country_access];
      }
    } else {
      countryAccess = userInfo.country_access;
    }
  }

  return (
    <nav className='h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6'>
      <div className='flex items-center gap-4'>
        {/* <h2 className='text-xl font-semibold text-gray-900'>
          {t('navbar.title')}
        </h2> */}
      </div>

      <div className='flex items-center gap-4'>
        {/* Country Selection */}
        {countryAccess.length > 0 && (
          <div className='flex items-center gap-2'>
            <MapPin className='w-4 h-4 text-gray-500' />
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className='w-[160px] h-9 border-gray-300'>
                <SelectValue placeholder='Select country' />
              </SelectTrigger>
              <SelectContent>
                {countryAccess.map(country => (
                  <SelectItem key={country} value={country}>
                    {countryLabels[country] || country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Language Selection */}
        <div className='flex items-center gap-2'>
          <Globe className='w-4 h-4 text-gray-500' />
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className='w-[180px] h-9 border-gray-300'>
              <SelectValue
                placeholder={
                  languages.find(l => l.value === selectedLanguage)?.label ||
                  'Select language'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {languages.map(language => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
