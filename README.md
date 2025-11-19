# Kefalonia Trips - Phase 1 MVP

A modern, interactive platform for discovering and booking trips and excursions in Kefalonia, Greece. This is a Phase 1 frontend prototype with mock data designed to validate UX and demonstrate the concept to stakeholders.

## 🌟 Features

### Client-Facing
- **Interactive Map**: Browse Kefalonia landmarks (POIs) with MapLibre GL
- **Trip Discovery**: Find trips by clicking POIs or browsing all trips
- **Advanced Filtering**: Filter by price, duration, vehicle type, languages, and ratings
- **Trip Details**: Beautiful trip pages with itineraries, inclusions/exclusions, and provider info
- **Booking Flow**: Demo booking sheet with date/time/party size selection
- **Provider Profiles**: View provider ratings, fleet, and all their custom trips
- **Ratings & Reviews**: Display of ratings (mock data in Phase 1)

### Provider Features (Phase 2+)
- Create custom trips with their own POIs, pricing, and schedules
- Manage availability calendar
- Receive and manage bookings
- Dashboard with analytics

### Technical Features
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** for styling
- **MapLibre GL** for interactive maps
- **PWA-ready** for kiosk/tablet installations
- **Responsive Design** - works on mobile, tablet, and desktop
- **SEO-optimized** with proper meta tags

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
kefalonia-trips-starter/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Home page with map
│   │   ├── trips/              # Trips listing
│   │   ├── trip/[slug]/        # Trip detail pages
│   │   ├── poi/[slug]/         # POI detail pages
│   │   ├── providers/[slug]/   # Provider profiles
│   │   └── confirm/            # Booking confirmation
│   ├── components/             # React components
│   │   ├── MapCanvas.tsx       # Interactive map
│   │   ├── TripCard.tsx        # Trip preview cards
│   │   ├── BookingSheet.tsx    # Booking form
│   │   └── RatingStars.tsx     # Star ratings display
│   ├── data/                   # Mock data
│   │   ├── pois.ts             # Points of interest
│   │   ├── trips.ts            # Sample trips
│   │   └── providers.ts        # Taxi service providers
│   └── lib/
│       ├── types.ts            # TypeScript definitions
│       └── store.ts            # Data access functions
├── public/
│   └── images/                 # Image assets
└── package.json
```

## 🗺️ Key User Flows

### 1. Browse by POI
```
Home → Click Myrtos Beach on map → See trips including Myrtos → Click trip → Book
```

### 2. Browse All Trips
```
Home → "Trips" nav → Filter/sort → Click trip → Book
```

### 3. Explore Provider
```
Trip detail → Click provider → See all their trips → Book another trip
```

## 📊 Current Mock Data

- **5 POIs**: Myrtos Beach, Melissani Cave, Assos Village, Fiskardo, Agia Efimia
- **3 Sample Trips**:
  - Myrtos Sunset + Assos Dinner (4h, €80/person)
  - North Coast Day Tour (8h, €420 fixed)
  - Melissani Cave Express (2.5h, €60/hour)
- **2 Providers**: Ionian Rides, Kefalonia Signature Tours

## 🎯 Next Steps (Phase 2)

### Backend Development
- [ ] PostgreSQL database with PostGIS for geo queries
- [ ] REST or GraphQL API (NestJS or FastAPI)
- [ ] Authentication (JWT, OAuth for providers)
- [ ] Booking system with availability management
- [ ] Real-time availability checking

### Payment Integration
- [ ] Stripe Connect for split payouts
- [ ] Support for deposits and full payments
- [ ] Refund handling

### Communication
- [ ] Email notifications (booking confirmations, reminders)
- [ ] SMS notifications via Twilio
- [ ] In-app messaging between clients and providers

### Provider Portal
- [ ] Dashboard to create/edit trips
- [ ] Availability calendar
- [ ] Booking management (accept/decline/complete)
- [ ] Earnings and analytics

### Reviews System
- [ ] Post-trip review submission
- [ ] Photo uploads
- [ ] Rating breakdown (comfort, punctuality, value)
- [ ] Provider responses

### Advanced Features
- [ ] Multi-language support (EN, GR, IT, DE)
- [ ] Dynamic pricing and promotions
- [ ] Favorite trips and providers
- [ ] Trip recommendations
- [ ] Kiosk mode with QR handoff
- [ ] iOS/Android apps (React Native or Flutter)

## 🏨 Kiosk/Touch Screen Strategy

The platform is designed to work on Android tablets in kiosk mode at:
- Hotel receptions
- Airport information desks
- Tourist information centers
- Popular cafés and restaurants

**How it works:**
1. Tablet runs in fullscreen kiosk mode showing the home page
2. Tourists browse trips and POIs
3. When ready to book, they scan a QR code to continue on their phone
4. Booking confirmation sent via email/SMS

## 💡 Monetization Options

1. **Commission per booking**: 10-15% of trip value
2. **Subscription model**: Monthly fee for providers to be listed
3. **Hybrid**: Low subscription + reduced commission
4. **Premium placement**: Featured listings for extra fee
5. **Lead generation**: Pay-per-quote in low season

## 🤝 Target Stakeholders

### Phase 1 Demo Audience
- **Hotel/Accommodation owners**: Show them the kiosk concept
- **Taxi/minivan operators**: Demonstrate the provider portal concept
- **Tourism associations**: Pitch the marketplace vision
- **Early investors**: Validate market fit

## 📝 Customization Guide

### Adding New POIs

Edit `src/data/pois.ts`:

```typescript
{
  id: 'poi_your_id',
  slug: 'your-slug',
  name: 'Your POI Name',
  lat: 38.xxxx,    // Latitude
  lon: 20.xxxx,    // Longitude
  categories: ['Beaches', 'Scenic'],
  images: ['https://...'],
  shortDesc: 'Brief description'
}
```

### Adding New Trips

Edit `src/data/trips.ts` and link to existing POI IDs.

### Styling

- Global styles: `src/app/globals.css`
- Tailwind config: `tailwind.config.ts`
- Color scheme: Currently using blue (`blue-600`) as primary

## 🐛 Known Limitations (Phase 1)

- No real authentication
- No real-time availability
- No actual payment processing
- No email/SMS notifications
- Mock ratings and reviews
- No provider dashboard yet
- Limited POI data (only 5 locations)

## 📞 Support

For questions about this codebase or the Kefalonia Trips project, contact the development team.

## 📄 License

Private - All Rights Reserved

---

**Built with ❤️ for Kefalonia's tourism community**
