import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { FilterProvider } from '@/lib/filter-store';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Agoraya',
    template: '%s | Agoraya',
  },
  description:
    'Agoraya — platform transparansi, pelaporan publik, dan tata kelola pemerintahan digital untuk Indonesia.',
  icons: {
    icon: '/logo/brand.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <ThemeProvider>
          <FilterProvider>{children}</FilterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
