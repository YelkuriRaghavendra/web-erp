import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Button } from './button';
import { t } from 'i18next';

export interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  className?: string;
}

const SortDropdown: React.FC<SortDropdownProps> = ({ options, className }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSort = searchParams.get('sort') || '';

  const handleSortChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('sort', value);
    } else {
      newParams.delete('sort');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const selectedOption = options.find(option => option.value === currentSort);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='default'
          className={`flex items-center justify-center gap-2 px-4 py-3 ${className || ''}`}
        >
          <ArrowUpDown className='w-4 h-4' />
          {selectedOption ? selectedOption.label : t('common.sortBy')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-auto min-w-max'>
        <DropdownMenuRadioGroup
          value={currentSort}
          onValueChange={handleSortChange}
          className='divide-y divide-gray-200'
        >
          {options.map(option => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className='whitespace-nowrap py-3'
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortDropdown;
