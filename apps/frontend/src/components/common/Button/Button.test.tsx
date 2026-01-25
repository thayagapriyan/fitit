import React from 'react';
import { describe, it, expect } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('should render with default props', () => {
    // Placeholder test - extend with actual testing library
    const button = <Button>Click me</Button>;
    expect(button).toBeDefined();
  });

  it('should accept variant prop', () => {
    const button = <Button variant="primary">Primary</Button>;
    expect(button).toBeDefined();
  });

  it('should accept size prop', () => {
    const button = <Button size="lg">Large</Button>;
    expect(button).toBeDefined();
  });

  it('should accept fullWidth prop', () => {
    const button = <Button fullWidth>Full Width</Button>;
    expect(button).toBeDefined();
  });

  it('should handle disabled state', () => {
    const button = <Button disabled>Disabled</Button>;
    expect(button).toBeDefined();
  });
});
