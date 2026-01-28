/**
 * @fileoverview Tests for PlayerCard component
 * @module PlayerCard.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PlayerCard from '../PlayerCard';

// Mock the Icons module
vi.mock('../Icons', () => ({
  Plus: () => <span data-testid="plus-icon">+</span>
}));

describe('PlayerCard Component', () => {
  const mockPlayer = {
    id: '1',
    name: 'Virat Kohli',
    role: 'Bat',
    avg: 52.5,
    sr: 142.8,
    bowlAvg: null,
    bowlEcon: null,
    country: 'India'
  };

  it('renders player name correctly', () => {
    render(<PlayerCard player={mockPlayer} />);
    expect(screen.getByText('Virat Kohli')).toBeInTheDocument();
  });

  it('displays player role with correct styling', () => {
    render(<PlayerCard player={mockPlayer} />);
    const roleElement = screen.getByText('Bat');
    expect(roleElement).toBeInTheDocument();
    expect(roleElement).toHaveClass('border-blue-500/50');
  });

  it('shows batting statistics for batsmen', () => {
    render(<PlayerCard player={mockPlayer} />);
    expect(screen.getByText('52.5')).toBeInTheDocument(); // Avg
    expect(screen.getByText('142.8')).toBeInTheDocument(); // SR
  });

  it('shows bowling statistics for bowlers', () => {
    const bowler = {
      ...mockPlayer,
      role: 'Bowl',
      bowlAvg: 28.5,
      bowlEcon: 7.8
    };
    render(<PlayerCard player={bowler} />);
    expect(screen.getByText('28.5')).toBeInTheDocument(); // Bowl Avg
    expect(screen.getByText('7.8')).toBeInTheDocument(); // Econ
  });

  it('calls onAdd callback when add button is clicked', () => {
    const mockOnAdd = vi.fn();
    render(<PlayerCard player={mockPlayer} onAdd={mockOnAdd} />);
    
    const addButton = screen.getByRole('button');
    fireEvent.click(addButton);
    
    expect(mockOnAdd).toHaveBeenCalledOnce();
  });

  it('does not render add button when onAdd is not provided', () => {
    render(<PlayerCard player={mockPlayer} />);
    const addButton = screen.queryByRole('button');
    expect(addButton).not.toBeInTheDocument();
  });

  it('handles all-rounder role styling', () => {
    const allrounder = {
      ...mockPlayer,
      role: 'All'
    };
    render(<PlayerCard player={allrounder} />);
    const roleElement = screen.getByText('All');
    expect(roleElement).toHaveClass('border-purple-500/50');
  });
});
