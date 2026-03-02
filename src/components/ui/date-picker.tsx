'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  disablePastDates?: boolean;
  minDate?: Date;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = 'Pick a date',
  className,
  disabled = false,
  disablePastDates = false,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    onSelect?.(selectedDate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          disabled={disabled}
          data-empty={!date}
          className={cn(
            'data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal',
            className
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {date ? format(date, 'dd/MM/yyyy') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <div className='flex items-center justify-center'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={handleSelect}
            fixedWeeks
            showOutsideDays
            captionLayout='dropdown'
            fromYear={2020}
            toYear={2040}
            disabled={date => {
              if (disablePastDates) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (date < today) return true;
              }
              if (minDate) {
                const min = new Date(minDate);
                min.setHours(0, 0, 0, 0);
                if (date < min) return true;
              }
              return false;
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
