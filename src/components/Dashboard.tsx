import React from 'react';
import { Button } from './ui/button';
import { useListMawbStore } from '@/store/listMawb';

const Dashboard: React.FC = () => {
  const { fetchMawbs } = useListMawbStore();
  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-6'>MAWB Listing</h1>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
          {/* Stats Cards */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-semibold text-gray-800 mb-2'>
              Total MAWB's
            </h3>
            <p className='text-3xl font-bold text-blue-600'>24</p>
          </div>
          <Button variant='default' onClick={fetchMawbs}>
            Begin call
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
