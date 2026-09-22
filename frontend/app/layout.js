import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Zavod ombori',
  description: 'Ombor kirim-chiqim hisobi',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Ombor', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icon-192.png', sizes: '192x192' }],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f4f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f17' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
