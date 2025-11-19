-- Seed POIs from Phase 1 data
INSERT INTO pois (slug, name, lat, lon, categories, short_desc, images, active, featured) VALUES
  ('myrtos-beach', 'Myrtos Beach', 38.3269, 20.5365, ARRAY['Beaches','Scenic'], 'Legendary white-pebble beach with dramatic cliffs and turquoise waters.', ARRAY['https://images.unsplash.com/photo-1592894504374-e47c62c93c97?w=1200&h=800&fit=crop'], true, true),
  ('melissani-cave', 'Melissani Cave', 38.2577, 20.6006, ARRAY['Caves','Nature'], 'Underground lake with ethereal blue light; boat tours available.', ARRAY['https://images.unsplash.com/photo-1601823984263-b55a29df133f?w=1200&h=800&fit=crop'], true, true),
  ('assos-village', 'Assos Village', 38.3785, 20.5453, ARRAY['Villages','Scenic'], 'Colorful seaside village beneath a Venetian fortress.', ARRAY['https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1200&h=800&fit=crop'], true, true),
  ('fiskardo', 'Fiskardo', 38.4568, 20.5776, ARRAY['Villages','Dining'], 'Chic harbor famous for yachts, pastel houses, and seafood.', ARRAY['https://images.unsplash.com/photo-1580837119756-563d608dd119?w=1200&h=800&fit=crop'], true, true),
  ('agia-efimia', 'Agia Efimia', 38.3002, 20.6002, ARRAY['Villages','Harbors'], 'Harbor village with cafés and access to hidden coves.', ARRAY['https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=1200&h=800&fit=crop'], true, false),
  ('drogarati-cave', 'Drogarati Cave', 38.2498, 20.6107, ARRAY['Caves','Nature'], 'Stunning limestone cave with stalactites and a concert hall.', ARRAY['https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=1200&h=800&fit=crop'], true, false),
  ('antisamos-beach', 'Antisamos Beach', 38.2834, 20.6187, ARRAY['Beaches','Nature'], 'Pebble beach surrounded by lush green hills, featured in Captain Corelli''s Mandolin.', ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop'], true, false),
  ('argostoli', 'Argostoli', 38.1742, 20.4911, ARRAY['Cities','Shopping','Dining'], 'Capital city with waterfront promenade, shops, restaurants, and loggerhead turtles.', ARRAY['https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&h=800&fit=crop'], true, false),
  ('kefalonia-airport', 'Kefalonia Airport', 38.1201, 20.5003, ARRAY['Transport'], 'Anna Pollatou International Airport - main gateway to Kefalonia.', ARRAY['https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=800&fit=crop'], true, false),
  ('sami', 'Sami', 38.2476, 20.6486, ARRAY['Villages','Harbors'], 'Port town with ferry connections, tavernas, and cave access.', ARRAY['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop'], true, false),
  ('xi-beach', 'Xi Beach', 38.1445, 20.4521, ARRAY['Beaches','Family'], 'Unique red sand beach with shallow waters, perfect for families.', ARRAY['https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&h=800&fit=crop'], true, false),
  ('petani-beach', 'Petani Beach', 38.3518, 20.5186, ARRAY['Beaches','Scenic'], 'Pristine beach with stunning turquoise waters and dramatic setting.', ARRAY['https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&h=800&fit=crop'], true, false),
  ('mount-ainos', 'Mount Ainos', 38.1367, 20.6333, ARRAY['Nature','Hiking','Scenic'], 'Highest peak in Kefalonia with endemic fir forest and panoramic views.', ARRAY['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop'], true, false);

-- Update location geography from lat/lon
UPDATE pois SET location = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography;
