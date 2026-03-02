import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const AdminContact: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className='flex flex-col items-center justify-center h-screen bg-gray-50'>
      <h1 className='text-2xl font-bold text-red-600 mb-4'>Access Denied</h1>
      <p className='text-center text-gray-700 mb-6'>
        {t('adminUserScreen.title')}
      </p>
      <Button onClick={() => navigate('/login')} className='px-6 py-2'>
        {t('adminUserScreen.goBack')}
      </Button>
    </div>
  );
};

export default AdminContact;
