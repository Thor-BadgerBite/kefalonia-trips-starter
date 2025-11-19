'use client';

interface CancellationPolicy {
  id: string;
  name: string;
  description: string | null;
  full_refund_hours: number | null;
  partial_refund_hours: number | null;
  partial_refund_percentage: number | null;
  no_refund_hours: number | null;
  cancellation_fee_fixed: number | null;
  cancellation_fee_percentage: number | null;
  allow_weather_cancellation: boolean;
  allow_emergency_cancellation: boolean;
}

interface CancellationPolicyProps {
  policy: CancellationPolicy | null;
  compact?: boolean;
}

export default function CancellationPolicy({ policy, compact = false }: CancellationPolicyProps) {
  if (!policy) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">No cancellation policy set</p>
            <p className="text-sm text-gray-600 mt-1">
              Please contact the provider directly for cancellation terms.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="text-sm text-gray-600">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {policy.full_refund_hours && (
              <>Free cancellation up to {policy.full_refund_hours} hours before</>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">{policy.name}</h3>
          {policy.description && (
            <p className="text-sm text-blue-800 mb-4">{policy.description}</p>
          )}

          <div className="space-y-3">
            {/* Full Refund */}
            {policy.full_refund_hours && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">100% Full Refund</p>
                  <p className="text-sm text-gray-600">
                    Cancel up to {policy.full_refund_hours} hours ({Math.floor(policy.full_refund_hours / 24)} days) before the trip starts
                  </p>
                </div>
              </div>
            )}

            {/* Partial Refund */}
            {policy.partial_refund_hours && policy.partial_refund_percentage && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{policy.partial_refund_percentage}% Partial Refund</p>
                  <p className="text-sm text-gray-600">
                    Cancel between {policy.partial_refund_hours} and {policy.full_refund_hours || 0} hours before the trip
                  </p>
                </div>
              </div>
            )}

            {/* No Refund */}
            {policy.no_refund_hours !== null && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">No Refund</p>
                  <p className="text-sm text-gray-600">
                    {policy.no_refund_hours === 0
                      ? 'No refund for cancellations made within 24 hours of the trip'
                      : `No refund for cancellations within ${policy.no_refund_hours} hours of the trip`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Cancellation Fees */}
            {((policy.cancellation_fee_fixed && policy.cancellation_fee_fixed > 0) ||
              (policy.cancellation_fee_percentage && policy.cancellation_fee_percentage > 0)) && (
              <div className="flex items-start gap-3 pt-3 border-t border-blue-200">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Cancellation Fees Apply:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {policy.cancellation_fee_fixed && policy.cancellation_fee_fixed > 0 && (
                      <li>Fixed fee: €{policy.cancellation_fee_fixed.toFixed(2)}</li>
                    )}
                    {policy.cancellation_fee_percentage && policy.cancellation_fee_percentage > 0 && (
                      <li>Percentage fee: {policy.cancellation_fee_percentage}% of booking amount</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Special Conditions */}
            {(policy.allow_weather_cancellation || policy.allow_emergency_cancellation) && (
              <div className="pt-3 border-t border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Special Conditions:</p>
                <ul className="space-y-1 text-sm text-blue-800">
                  {policy.allow_weather_cancellation && (
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                      Full refund for severe weather cancellations
                    </li>
                  )}
                  {policy.allow_emergency_cancellation && (
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Full refund for documented emergencies
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-blue-700">
          💡 <strong>Tip:</strong> Refunds are processed back to your original payment method within 5-10 business days.
        </p>
      </div>
    </div>
  );
}
