'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Kefalonia Trips</h3>
            <p className="text-sm leading-relaxed">
              {language === 'el'
                ? 'Ανακαλύψτε τις καλύτερες εκδρομές και εμπειρίες στην Κεφαλονιά με έμπιστους τοπικούς παρόχους.'
                : 'Discover the best trips and experiences in Kefalonia with trusted local providers.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">
              {language === 'el' ? 'Γρήγοροι Σύνδεσμοι' : 'Quick Links'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link href="/trips" className="hover:text-white transition">
                  {t.nav.trips}
                </Link>
              </li>
              <li>
                <Link href="/providers" className="hover:text-white transition">
                  {t.nav.providers}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  {t.nav.dashboard}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h4 className="text-white font-semibold mb-4">
              {language === 'el' ? 'Για Παρόχους' : 'For Providers'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/login" className="hover:text-white transition">
                  {language === 'el' ? 'Σύνδεση Παρόχου' : 'Provider Login'}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  {language === 'el' ? 'Πίνακας Ελέγχου' : 'Dashboard'}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/analytics" className="hover:text-white transition">
                  {language === 'el' ? 'Αναλυτικά' : 'Analytics'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">
              {language === 'el' ? 'Επικοινωνία' : 'Contact'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:info@kefalonia-trips.com" className="hover:text-white transition">
                  info@kefalonia-trips.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+302671000000" className="hover:text-white transition">
                  +30 2671 000000
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} Kefalonia Trips. {language === 'el' ? 'Όλα τα δικαιώματα κατοχυρωμένα.' : 'All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
}
