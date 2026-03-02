import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ListSelector from '../list-selector';

// Mock data
const mockItems = [
  { value: 'Chile', label: 'Chile' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Brazil', label: 'Brazil' },
];

describe('ListSelector', () => {
  it('renders with default placeholder', () => {
    const mockOnValueChange = vi.fn();

    render(
      <ListSelector
        onValueChange={mockOnValueChange}
        items={mockItems}
        placeholder='Select an item'
        searchPlaceholder='Search items...'
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('opens dropdown and shows items when clicked', async () => {
    const mockOnValueChange = vi.fn();

    render(
      <ListSelector
        onValueChange={mockOnValueChange}
        items={mockItems}
        placeholder='Select an item'
        searchPlaceholder='Search items...'
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Chile')).toBeInTheDocument();
      expect(screen.getByText('Argentina')).toBeInTheDocument();
      expect(screen.getByText('Brazil')).toBeInTheDocument();
    });
  });

  it('filters items based on search input', async () => {
    const mockOnValueChange = vi.fn();

    render(
      <ListSelector
        onValueChange={mockOnValueChange}
        items={mockItems}
        placeholder='Select an item'
        searchPlaceholder='Search items...'
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'Chi' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Chile')).toBeInTheDocument();
      expect(screen.queryByText('Argentina')).not.toBeInTheDocument();
      expect(screen.queryByText('Brazil')).not.toBeInTheDocument();
    });
  });

  it('calls onValueChange when an item is selected', async () => {
    const mockOnValueChange = vi.fn();

    render(
      <ListSelector
        onValueChange={mockOnValueChange}
        items={mockItems}
        placeholder='Select an item'
        searchPlaceholder='Search items...'
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      const chileOption = screen.getByText('Chile');
      fireEvent.click(chileOption);
    });

    expect(mockOnValueChange).toHaveBeenCalledWith('Chile');
  });

  it('shows selected item in the trigger', () => {
    const mockOnValueChange = vi.fn();

    render(
      <ListSelector
        value='Chile'
        onValueChange={mockOnValueChange}
        items={mockItems}
        placeholder='Select an item'
        searchPlaceholder='Search items...'
      />
    );

    expect(screen.getByText('Chile')).toBeInTheDocument();
  });

  it('shows no items found message when search yields no results', async () => {
    const mockOnValueChange = vi.fn();

    render(
      <ListSelector
        onValueChange={mockOnValueChange}
        items={mockItems}
        placeholder='Select an item'
        searchPlaceholder='Search items...'
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'xyz' } });
    });

    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });
});
