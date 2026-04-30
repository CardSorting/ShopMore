import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './AdminInputs';

describe('TagInput', () => {
  it('renders with label and initial tags', () => {
    render(
      <TagInput 
        label="Product Tags" 
        tags={['TCG', 'Rare']} 
        onChange={() => {}} 
      />
    );

    expect(screen.getByText(/Product Tags/i)).toBeInTheDocument();
    expect(screen.getByText('TCG')).toBeInTheDocument();
    expect(screen.getByText('Rare')).toBeInTheDocument();
  });

  it('calls onChange when a new tag is added via Enter', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <TagInput 
        label="Tags" 
        tags={['A']} 
        onChange={onChange} 
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'B{Enter}');

    expect(onChange).toHaveBeenCalledWith(['A', 'B']);
  });

  it('calls onChange when a tag is removed', async () => {
    const onChange = vi.fn();
    
    render(
      <TagInput 
        label="Tags" 
        tags={['A', 'B']} 
        onChange={onChange} 
      />
    );

    // Find the button that contains the X icon next to 'A'
    const removeBtns = screen.getAllByRole('button');
    // In our component, tags are rendered first. 
    // Tag 'A' button is the first one.
    fireEvent.click(removeBtns[0]);

    expect(onChange).toHaveBeenCalledWith(['B']);
  });

  it('shows suggestions when typing', async () => {
    const user = userEvent.setup();
    render(
      <TagInput 
        label="Tags" 
        tags={[]} 
        onChange={() => {}} 
        suggestions={['Pokemon', 'Magic', 'Yu-Gi-Oh']} 
      />
    );

    const input = screen.getByPlaceholderText('Add tag...');
    await user.type(input, 'Pok');

    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Pokemon')).toBeInTheDocument();
    expect(screen.queryByText('Magic')).not.toBeInTheDocument();
  });
});
