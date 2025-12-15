import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Poppins } from 'next/font/google';
import HamburgerMenu from './components/HamburgerMenu';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'Smart Campus Navigator',
  description: 'Top 1% FSD Project with SF Pro & Poppins',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sfpro">
        <HamburgerMenu />
        {children}
      </body>
    </html>
  );
}