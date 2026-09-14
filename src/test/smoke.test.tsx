import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('smoke', () => {
  it('renders into jsdom with jest-dom matchers', () => {
    render(<p>hello</p>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
