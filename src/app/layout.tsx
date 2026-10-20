import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Agoraya',
    template: '%s | Agoraya',
  },
  description:
    'Agoraya — platform transparansi, pelaporan publik, dan tata kelola pemerintahan digital untuk Indonesia.',
};

// Root layout: wires the global design system (tokens in
// src/styles/globals.css) into the app router shell.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
