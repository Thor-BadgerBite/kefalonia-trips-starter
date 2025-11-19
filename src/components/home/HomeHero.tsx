'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import SearchBar from '@/components/SearchBar';

interface HomeHeroProps {
  tripsCount: number;
  providersCount: number;
}

export default function HomeHero({ tripsCount, providersCount }: HomeHeroProps) {
  const { t } = useLanguage();

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t.home.hero.title}
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              {t.home.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t.home.hero.subtitle}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{tripsCount}+</div>
              <div className="text-sm text-blue-100">{t.home.stats.activeTrips}</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{providersCount}+</div>
              <div className="text-sm text-blue-100">{t.home.stats.verifiedProviders}</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-blue-100">{t.home.stats.happyTravelers}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
