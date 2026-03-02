import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Sun, Moon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const languageOptions = [
  { code: 'es-CL', label: 'Español (CL)' },
  { code: 'en-US', label: 'English (US)' },
];

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language || 'es-CL';

  const handleChangeLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <div className='p-6 max-w-4xl'>
      <h1 className='sr-only'>Configuración del sistema - En desarrollo</h1>
      <button
        aria-hidden={false}
        className='sr-only'
        onClick={() =>
          handleChangeLanguage(currentLang === 'en-US' ? 'es-CL' : 'en-US')
        }
      >
        {`language : ${currentLang}`}
      </button>
      <div className='flex items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>
            {t('settings.title') || 'Configuración del sistema'}
          </h1>
          <p className='text-sm text-gray-500'>
            {t('settings.subtitle') ||
              'Ajustes globales del panel de administración'}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => window.location.reload()}
            title={t('settings.reload') || 'Recargar'}
          >
            <RefreshCw className='w-4 h-4' />
            <span className='hidden sm:inline'>
              {t('settings.reload') || 'Recargar'}
            </span>
          </Button>
        </div>
      </div>

      <section className='bg-white border border-gray-100 rounded-lg shadow-sm p-4 mb-4'>
        <h2 className='text-sm font-medium text-gray-700 mb-3 flex items-center gap-2'>
          <Globe className='w-4 h-4 text-gray-500' />
          {t('settings.language.title') || 'Idioma'}
        </h2>

        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-md bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600'>
              <Sun className='w-4 h-4' />
            </div>
            <div className='text-sm text-gray-600'>
              <div className='font-medium'>
                {languageOptions.find(l => l.code === currentLang)?.label}
              </div>
              <div className='text-xs text-gray-400'>{currentLang}</div>
            </div>
          </div>

          <div className='flex items-center gap-2 mt-3 sm:mt-0'>
            {languageOptions.map(opt => (
              <Button
                key={opt.code}
                variant={opt.code === currentLang ? 'default' : 'outline'}
                size='sm'
                onClick={() => handleChangeLanguage(opt.code)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-white border border-gray-100 rounded-lg shadow-sm p-4'>
        <h2 className='text-sm font-medium text-gray-700 mb-3 flex items-center gap-2'>
          <Moon className='w-4 h-4 text-gray-500' />
          {t('settings.general.title') || 'Preferencias'}
        </h2>

        <p className='text-sm text-gray-500 mb-4'>
          {t('settings.general.description') ||
            'Aquí podrás encontrar futuras opciones para personalizar el comportamiento del panel.'}
        </p>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <div className='p-3 border border-gray-100 rounded-md'>
            <div className='text-sm font-medium text-gray-800'>Theme</div>
            <div className='text-xs text-gray-400'>
              Light / Dark / Auto - Por implementar
            </div>
          </div>

          <div className='p-3 border border-gray-100 rounded-md'>
            <div className='text-sm font-medium text-gray-800'>
              Integrations
            </div>
            <div className='text-xs text-gray-400'>
              Placeholders for external integrations
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
