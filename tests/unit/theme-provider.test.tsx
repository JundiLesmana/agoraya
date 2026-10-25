// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '@/components/theme-provider';

function Probe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button data-testid="toggle" onClick={toggleTheme}>
        Ganti tema
      </button>
    </div>
  );
}

function Harness() {
  return (
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );
}

describe('theme provider (dark/light toggle)', () => {
  beforeEach(() => {
    window.localStorage.removeItem('agoraya-theme');
    document.documentElement.classList.remove('dark');
  });

  it('defaultnya light dan tidak menambahkan kelas .dark', () => {
    render(<Harness />);
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('menyimpan preferensi gelap ke localStorage dan menambahkan kelas .dark saat ditoggle', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(window.localStorage.getItem('agoraya-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(window.localStorage.getItem('agoraya-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('memuat preferensi tersimpan dari localStorage saat dipasang ulang', () => {
    window.localStorage.setItem('agoraya-theme', 'dark');
    render(<Harness />);
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
