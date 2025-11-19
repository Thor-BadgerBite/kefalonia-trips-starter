'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Link href="/loyalty" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Loyalty
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
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.home}
              </Link>
              <Link
                href="/trips"
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.trips}
              </Link>
              <Link
                href="/packages"
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Packages
              </Link>
              <Link
                href="/loyalty"
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Loyalty
              </Link>
              <Link
                href="/providers"
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.providers}
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.dashboard}
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.signIn}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
