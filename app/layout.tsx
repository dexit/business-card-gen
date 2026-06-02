import type {Metadata} from 'next';
import { Inter, Space_Grotesk, Playfair_Display, JetBrains_Mono, Outfit, Cormorant_Garamond } from 'next/font/google';
import './globals.css'; 

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  title: 'High-Res Business Card Builder',
  description: 'Interactive business card design studio with drag & drop editing, print templates, bleed/safe guides, crop marks, CMYK simulation, and vector-grade PDF export.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} ${outfit.variable} ${cormorant.variable}`}>
      <body suppressHydrationWarning className="bg-[#fcfbf9] text-stone-900 font-sans antialiased">{children}</body>
    </html>
  );
}
