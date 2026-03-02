import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('merges multiple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'inactive')).toBe(
      'base active'
    );
  });

  it('filters out falsy values', () => {
    expect(cn('base', null, undefined, '', 'valid')).toBe('base valid');
  });

  it('merges conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles arrays of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('handles objects with conditional classes', () => {
    expect(cn({ 'is-active': true, 'is-disabled': false }, 'base')).toBe(
      'is-active base'
    );
  });

  it('returns empty string for no valid classes', () => {
    expect(cn(null, undefined, '')).toBe('');
  });

  it('preserves important modifiers', () => {
    expect(cn('!text-red-500', 'text-blue-500')).toBe(
      '!text-red-500 text-blue-500'
    );
  });
});
