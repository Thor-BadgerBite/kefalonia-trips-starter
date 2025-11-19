import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kefalonia Trips — MVP',
  description: 'Discover and book curated and provider-created trips across Kefalonia.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">Kefalonia Trips</Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/trips">Trips</Link>
              <Link href="/transfers">Transfers</Link>
              <Link href="/auth/login">Provider Login</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t mt-10 py-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Kefalonia Trips (MVP)
        </footer>
      </body>
    </html>
  );
}
