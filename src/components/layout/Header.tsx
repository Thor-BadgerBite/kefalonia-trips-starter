'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl md:text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
            Kefalonia Trips
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition">
              {t.nav.home}
            </Link>
            <Link href="/trips" className="text-gray-700 hover:text-blue-600 font-medium transition">
              {t.nav.trips}
            </Link>
            <Link href="/packages" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Packages
            </Link>
            <Link href="/providers" className="text-gray-700 hover:text-blue-600 font-medium transition">
              {t.nav.providers}
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition">
              {t.nav.dashboard}
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher compact />

            <Link
              href="/auth/login"
              className="hidden md:inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              {t.nav.signIn}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
