import React from 'react';

interface PaginationProps {
  curPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  curPage,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
}) => {
  const handlePageChange = (page: number) => {
    if (page < 1) return;
    onPageChange(page);
  };

  return (
    <nav
      role='navigation'
      aria-label='Pagination Navigation'
      className='mt-6 flex justify-center items-center space-x-4'
    >
      <button
        onClick={() => handlePageChange(curPage - 1)}
        disabled={!hasPreviousPage}
        className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white'
      >
        Previous
      </button>
      <span className='text-sm text-gray-700'>Page {curPage}</span>
      <button
        onClick={() => handlePageChange(curPage + 1)}
        disabled={!hasNextPage}
        className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white'
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
