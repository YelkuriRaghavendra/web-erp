import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface ListItem {
  value: string;
  label: string;
}

interface ListSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  items: ListItem[];
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
  isLoading?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSearch?: (search: string) => Promise<ListItem[]> | ListItem[];
}

const ListSelector: React.FC<ListSelectorProps> = ({
  value,
  onValueChange,
  items,
  placeholder,
  searchPlaceholder,
  disabled = false,
  className,
  'data-testid': dataTestId,
  isLoading = false,
  onOpenChange,
  onSearch,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<ListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchValue, setDebouncedSearchValue]);

  useEffect(() => {
    if (value) {
      const item = items.find(item => item.value === value);
      if (item) {
        setSelectedItem(item);
      }
    } else {
      setSelectedItem(null);
    }
  }, [value, items]);

  const filteredItems = useMemo(() => {
    if (onSearch) {
      // Server-side search: use searchResults when available, otherwise use original items
      return debouncedSearchValue ? searchResults : items;
    } else {
      // Client-side search: filter items locally
      if (!searchValue) return items;
      return items.filter(item =>
        item.label.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
  }, [searchValue, items, searchResults, onSearch, debouncedSearchValue]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchValue('');
      setDebouncedSearchValue('');
      setSearchResults([]);
    }
    onOpenChange?.(newOpen);
  };

  const handleSearchChange = useCallback(async (value: string) => {
    setSearchValue(value);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (onSearch && debouncedSearchValue.trim()) {
        setIsSearching(true);
        try {
          const results = await onSearch(debouncedSearchValue.trim());
          setSearchResults(results);
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else if (onSearch && !debouncedSearchValue.trim()) {
        setSearchResults([]);
      }
    };

    performSearch();
  }, [debouncedSearchValue, onSearch]);

  const handleSelect = (itemValue: string) => {
    // Find the item from filtered items or all items to get the full item object
    const item =
      filteredItems.find(item => item.value === itemValue) ||
      items.find(item => item.value === itemValue);
    if (item) {
      setSelectedItem(item);
    }
    onValueChange(itemValue);
    setOpen(false);
    setSearchValue('');
    setDebouncedSearchValue('');
    setSearchResults([]);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'w-full justify-between text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
          data-testid={dataTestId}
        >
          {selectedItem ? selectedItem.label : placeholder}
          <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <div className='border-b border-gray-200 p-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => handleSearchChange(e.target.value)}
              className='pl-9 border-none shadow-none focus-visible:ring-0'
            />
          </div>
        </div>
        <div className='max-h-[240px] overflow-y-auto'>
          {isLoading || isSearching ? (
            <div className='p-1 space-y-2'>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className='flex items-center px-2 py-2'>
                  <Skeleton className='h-4 w-4 mr-2' />
                  <Skeleton className='h-4 flex-1' />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className='py-6 text-center text-sm text-gray-500'>
              {searchValue ? 'No items found' : 'No items available'}
            </div>
          ) : (
            <div className='p-1'>
              {filteredItems.map(item => (
                <div
                  key={item.value}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm hover:bg-gray-100',
                    value === item.value && 'bg-gray-100'
                  )}
                  onClick={() => handleSelect(item.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ListSelector;
