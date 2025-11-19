# Kefalonia Trips - Complete Platform (Phase 2)

A complete marketplace platform for discovering and booking trips, excursions, and transfers in Kefalonia, Greece. Connects tourists with local taxi operators and tour providers through an intuitive web platform.

## 🌟 Features

### For Tourists (Client-Side)

#### Trip Discovery
- **Interactive Map**: Browse 13+ Kefalonia landmarks (POIs) with MapLibre GL
- **Smart Search**: Click any POI to see all trips that include it
- **Trip Filtering**: Filter by price, duration, vehicle type, languages, and ratings
- **Detailed Itineraries**: See stop-by-stop trip details with durations and descriptions
- **Provider Profiles**: View ratings, reviews, fleet, and all provider offerings
- **Booking System**: Request bookings with date/time/party size selection

#### Transfer Search
- **Point-to-Point Transfers**: Search transfers between any two locations
- **22 Regions**: Airport, Argostoli, Lassi, Fiskardo, and 19 more areas
- **Smart Matching**: System auto-matches your accommodation location
- **Compare Prices**: See all available providers sorted by price or rating
- **Multiple Vehicle Options**: Sedan, minivan, or minibus
- **Flexible Pricing**: Per-route, per-person, or hourly rates

### For Providers (Dashboard)

#### Trip Creation Wizard
- **Interactive Map**: Click POIs on map to build trip itinerary
- **10 Stop Types with Icons**:
  - 📸 Photo Shoot
  - ⏰ Free Time
  - 🛍️ Shopping Stop
  - 🏛️ Museum Visit
  - 🏖️ Beach Stop
  - 🏊 Swim Stop
  - ⛪ Monastery Visit
  - 🍽️ Restaurant Break
  - 👁️ Viewpoint
  - 🍷 Wine Tasting
- **Custom Stop Details**: Name each stop (e.g., "Myrtos Photo Shoot - 20min")
- **Duration Management**: Set stop durations with quick presets
- **Drag to Reorder**: Arrange stops in your preferred sequence
- **Auto-Calculations**: System calculates total trip time including drive time
- **Social Photos**: Upload client photos to showcase experiences

#### Transfer Pricelist Management
- **Bulk Upload**: Add multiple routes at once
- **Flexible Pricing**: Per-route (total), per-person, or hourly
- **Vehicle Types**: Different rates for sedan, minivan, minibus
- **Max Passengers**: Set capacity limits per route
- **Active/Inactive**: Control which prices are visible to clients
- **Quick Edit/Delete**: Manage your entire pricelist

#### Dashboard
- **Real-time Stats**: Trips, bookings, ratings, today's schedule
- **Booking Management**: View and manage all booking requests
- **Trip Management**: List, edit, activate/deactivate your trips
- **Calendar**: Manage availability and blocked dates
- **Fleet Management**: Add and update your vehicles
- **Settings**: Profile, languages, contact info

### Technical Features
- **Next.js 14** with App Router and TypeScript
- **Supabase** backend (PostgreSQL + PostGIS + Auth + RLS)
- **Tailwind CSS** for styling
- **MapLibre GL** for interactive maps
- **Row Level Security**: Multi-tenant data isolation
- **PWA-ready** for kiosk/tablet installations
- **Responsive Design** - works on mobile, tablet, and desktop
- **Real-time Data**: Live updates from database
- **SEO-optimized** with proper meta tags

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier is fine)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### Supabase Setup

Follow the detailed guide in [SETUP.md](./SETUP.md):

1. Create Supabase project
2. Run 3 migration files in SQL Editor
3. Add environment variables
4. Create your first provider account

## 📁 Project Structure

```
kefalonia-trips-starter/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Home page with map
│   │   ├── trips/              # Trips listing
│   │   ├── trip/[slug]/        # Trip detail pages
│   │   ├── transfers/          # Transfer search
│   │   ├── poi/[slug]/         # POI detail pages
│   │   ├── providers/[slug]/   # Provider profiles
│   │   ├── auth/               # Login/signup
│   │   ├── dashboard/          # Provider dashboard
│   │   │   ├── trips/          # Trip management
│   │   │   │   └── create/     # Trip creation wizard
│   │   │   ├── transfers/      # Transfer pricelist
│   │   │   ├── bookings/       # Booking management
│   │   │   └── vehicles/       # Fleet management
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── trip-creation/      # Trip wizard components
│   │   │   ├── POIMapSelector.tsx
│   │   │   └── TripItineraryBuilder.tsx
│   │   ├── MapCanvas.tsx       # Interactive map
│   │   ├── TripCard.tsx        # Trip preview cards
│   │   ├── BookingSheet.tsx    # Booking form
│   │   └── RatingStars.tsx     # Star ratings display
│   ├── lib/
│   │   ├── supabase/           # Supabase clients
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── database.types.ts
│   │   ├── types.ts            # TypeScript definitions
│   │   └── store.ts            # Data access (Phase 1 mock)
│   └── middleware.ts           # Route protection
├── supabase/
│   └── migrations/             # Database migrations
│       ├── 20250101000000_initial_schema.sql
│       ├── 20250101000001_seed_pois.sql
│       └── 20250101000002_trip_creation_transfers.sql
└── public/
    └── images/                 # Image assets
```

## 🗺️ Key User Flows

### Tourist Books a Trip
```
Home → Click Myrtos Beach on map → See 4 trips →
Click "North Coast Day Tour" → Review itinerary →
Book (date/time/party size) → Confirmation
```

### Tourist Books a Transfer
```
Transfers → Select Airport → Select Argostoli →
Enter passengers → Search → Compare 5 providers →
Choose by price/rating → Book transfer
```

### Provider Creates Trip
```
Login → Dashboard → Create Trip →
Enter trip name & pricing →
Click POIs on map (Myrtos, Assos, Fiskardo) →
For each stop:
  - Select type (Photo Shoot)
  - Set duration (20 min)
  - Add custom name & description
→ System calculates total time → Save trip
```

### Provider Adds Transfer Prices
```
Dashboard → Transfers → Add Prices →
Select "From Airport" →
Multi-select destinations (Argostoli, Lassi, etc.) →
Set vehicle type & price →
System creates 10+ routes at once
```

## 📊 Database Schema

### Core Tables
- **providers** - Taxi operators/tour companies
- **vehicles** - Provider fleet
- **pois** - Points of interest (13 seeded)
- **trips** - Custom trips created by providers
- **trip_pois** - Trip itinerary with stop details
- **poi_stop_types** - 10 predefined stop types
- **transfer_regions** - 22 Kefalonia areas
- **transfer_pricelists** - Point-to-point transfer rates
- **bookings** - Customer booking requests
- **availability** - Provider calendar
- **reviews** - Customer feedback

### Key Features
- **PostGIS** for geographic calculations
- **RLS (Row Level Security)** for multi-tenancy
- **Auto-triggers** for timestamps and booking numbers
- **Functions** for distance/time calculations

## 🎯 Current Status

### ✅ Completed (Phase 1 & 2)
- [x] Interactive map with POI markers
- [x] Trip browsing and search
- [x] Provider authentication
- [x] Provider dashboard
- [x] Trip creation wizard with map
- [x] POI stop types with icons
- [x] Automatic time/distance calculations
- [x] Trip management (list/edit)
- [x] Transfer pricelist management
- [x] Transfer search for clients
- [x] Supabase integration
- [x] Database schema & migrations
- [x] Row level security policies

### 🚧 Phase 3 (Next Steps)
- [ ] Real booking system with database storage
- [ ] Email notifications (Resend integration)
- [ ] SMS notifications (Twilio)
- [ ] Payment processing (Stripe Connect)
- [ ] Availability calendar UI
- [ ] Review submission system
- [ ] Trip editing functionality
- [ ] Provider vehicle management
- [ ] Multi-language support (Greek, Italian, German)
- [ ] Photo upload for trips and reviews

## 💡 Usage Examples

### Example 1: Airport Transfer Provider

Provider "Ionian Transfers" wants to offer airport pickups:

1. Login → Dashboard → Transfers
2. From: Airport
3. To: Select all accommodation areas (Argostoli, Lassi, Fiskardo, etc.)
4. Vehicle: Minivan
5. Price: €45 per route
6. Max passengers: 8
7. Saves 15 transfer routes instantly

Now when tourists search "Airport → Argostoli", they see this provider's €45 offer.

### Example 2: Custom Trip Creation

Provider "Kefalonia Tours" creates "Highlights Tour":

1. Dashboard → Create Trip
2. Name: "North Coast Highlights"
3. Click POIs on map:
   - Myrtos Beach (Photo Shoot, 20 min)
   - Assos Village (Free Time, 1 hour)
   - Fiskardo (Restaurant Break, 1.5 hours)
4. System calculates: 3 stops + 90min drive time = 4 hours total
5. Set price: €85 per person
6. Save → Trip goes live

Tourists clicking "Myrtos Beach" now see this trip.

## 🔐 Security

- **Supabase Authentication** with email/password
- **Row Level Security (RLS)** - providers only see their data
- **Protected routes** via Next.js middleware
- **Environment variables** for sensitive keys
- **HTTPS** enforcement in production
- **Input validation** on all forms
- **SQL injection protection** via Supabase client

## 📈 Scalability

- **Supabase** handles up to 500GB free tier
- **Vercel** for serverless frontend (auto-scaling)
- **PostGIS** efficient for geographic queries
- **CDN** for static assets
- **Database indexes** on all foreign keys
- **Pagination** ready for large datasets

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Connect GitHub repo to Vercel
# Set environment variables
# Auto-deploy on push
```

### Database (Supabase)
- Already hosted in the cloud
- Automatic backups on paid plans
- Run migrations via SQL Editor or CLI

## 🤝 Contributing

This is a private project for Kefalonia tourism operators. For access or questions:
- Create an issue in the repository
- Contact the development team

## 📄 License

Private - All Rights Reserved

---

**Built for Kefalonia's tourism community** 🇬🇷
