import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Footer } from '@/components/footer';

describe('Footer security', () => {
  it('does not expose window.opener through external links', () => {
    render(<Footer />);

    const socialLinks = ['instagram', 'youtube', 'facebook'].map((name) => screen.getByRole('link', { name: new RegExp(name, 'i') }));

    for (const link of socialLinks) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
    }
  });
});
