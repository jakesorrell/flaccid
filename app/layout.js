import './globals.css';

export const metadata = {
  title: 'FLACCID',
  description: 'Pine Dunes Resort & Golf Club Tournament Tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
