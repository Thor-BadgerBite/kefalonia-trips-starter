import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TransferBookingForm from '@/components/booking/TransferBookingForm';

export const metadata = {
  title: 'Book Transfer | Kefalonia Trips',
  description: 'Complete your transfer booking',
};

export default async function BookTransferPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createServerSupabaseClient();

  const providerId = searchParams['provider'];
  const fromRegion = searchParams['from'];
  const toRegion = searchParams['to'];
  const passengers = searchParams['pax'] || '2';
  const price = searchParams['price'] || '0';
  const date = searchParams['date'] || '';
  const time = searchParams['time'] || '09:00';

  if (!providerId || !fromRegion || !toRegion) {
    redirect('/transfers');
  }

  // Get provider details
  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('id', providerId)
    .single();

  if (!provider) {
    redirect('/transfers');
  }

  // Get region details
  const { data: regions } = await supabase
    .from('transfer_regions')
    .select('*')
    .in('id', [fromRegion, toRegion]);

  const fromRegionData = regions?.find((r) => r.id === fromRegion);
  const toRegionData = regions?.find((r) => r.id === toRegion);

  // Get provider's vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('provider_id', providerId)
    .eq('active', true)
    .gte('capacity', parseInt(passengers));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Transfer Booking</h1>
          <p className="text-gray-600 mt-2">
            Safe and reliable transfer service across Kefalonia
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <TransferBookingForm
              provider={provider}
              fromRegion={fromRegionData}
              toRegion={toRegionData}
              availableVehicles={vehicles || []}
              defaultDate={date}
              defaultTime={time}
              defaultPassengers={parseInt(passengers)}
              estimatedPrice={parseFloat(price)}
            />
          </div>

          {/* Transfer Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Transfer Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-blue-600 font-medium">FROM</div>
                      <div className="font-semibold">{fromRegionData?.name}</div>
                    </div>
                  </div>
                  <div className="border-l-2 border-dashed border-blue-300 ml-4 h-6"></div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                      B
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-green-600 font-medium">TO</div>
                      <div className="font-semibold">{toRegionData?.name}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium">{provider.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Passengers:</span>
                    <span className="font-medium">{passengers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">
                      ★ {provider.rating_avg.toFixed(1)} ({provider.rating_count})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Languages:</span>
                    <span className="font-medium">
                      {provider.languages?.join(', ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estimated Price:</span>
                    <span className="text-2xl font-bold text-blue-600">€{price}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                <strong>Note:</strong> Final price will be confirmed by the provider based
                on exact pickup/dropoff locations and any special requirements.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
