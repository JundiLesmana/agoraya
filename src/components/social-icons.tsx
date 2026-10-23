import * as React from 'react';

function Instagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Youtube(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.6 7.2c.2.9.4 2.1.4 4.8s-.2 3.9-.4 4.8a2.7 2.7 0 0 1-1.9 1.9c-1.6.4-7.7.4-7.7.4s-6.1 0-7.7-.4a2.7 2.7 0 0 1-1.9-1.9c-.2-.9-.4-2.1-.4-4.8s.2-3.9.4-4.8A2.7 2.7 0 0 1 4.3 5.3c1.6-.4 7.7-.4 7.7-.4s6.1 0 7.7.4a2.7 2.7 0 0 1 1.9 1.9Z" />
      <path d="m10 15 5-3-5-3v6Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Facebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 8.5h2.5V5.5H14c-1.9 0-3.5 1.6-3.5 3.5V11H8v3h2.5v5H14v-5h2.5l.5-3H14V9c0-.3.2-.5.5-.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export { Facebook, Instagram, Youtube };
