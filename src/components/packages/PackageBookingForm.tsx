'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VoucherCodeInput from '../booking/VoucherCodeInput';

interface PackageBookingFormProps {
  packageData: {
    id: string;
    name: string;
    slug: string;
    package_price: number;
    min_guests: number;
    max_guests: number | null;
    provider_id: string;
  };
  trips: any[];
}

export default function PackageBookingForm({
  packageData,
  trips,
}: PackageBookingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);

  const [formData, setFormData] = useState({
    start_date: '',
    num_guests: packageData.min_guests,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    special_requests: '',
  });

  const calculateBasePrice = () => {
    return packageData.package_price * formData.num_guests;
  };

  const calculateTotalPrice = () => {
    if (appliedVoucher) {
      return appliedVoucher.final_amount;
    }
    return calculateBasePrice();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/package-bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: packageData.id,
          provider_id: packageData.provider_id,
          start_date: formData.start_date,
          num_guests: formData.num_guests,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          special_requests: formData.special_requests,
          package_price: packageData.package_price,
          total_price: calculateTotalPrice(),
          voucher_code: appliedVoucher?.code || null,
          discount_amount: appliedVoucher?.discount_amount || 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        alert('Failed to create booking: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = calculateTotalPrice();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Date *
        </label>
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) =>
            setFormData({ ...formData, start_date: e.target.value })
          }
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          First trip starts on this date
        </p>
      </div>

      {/* Number of Guests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Guests *
        </label>
        <select
          value={formData.num_guests}
          onChange={(e) =>
            setFormData({ ...formData, num_guests: parseInt(e.target.value) })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          {Array.from(
            {
              length: packageData.max_guests
                ? packageData.max_guests - packageData.min_guests + 1
                : 20,
            },
            (_, i) => packageData.min_guests + i
          ).map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'guest' : 'guests'}
            </option>
          ))}
        </select>
      </div>

      {/* Total Price Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-700">
            Package price × {formData.num_guests}
          </span>
          <span className="font-semibold">
            €{(packageData.package_price * formData.num_guests).toFixed(2)}
          </span>
        </div>
        {appliedVoucher && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-green-700">
              Discount ({appliedVoucher.code})
            </span>
            <span className="font-semibold text-green-700">
              -€{appliedVoucher.discount_amount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-blue-200">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            €{totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Customer Information */}
      <div className="pt-4 border-t">
        <h3 className="font-semibold text-gray-900 mb-3">
          Contact Information
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) =>
                setFormData({ ...formData, customer_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) =>
                setFormData({ ...formData, customer_email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) =>
                setFormData({ ...formData, customer_phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+30 123 456 7890"
              required
            />
          </div>
        </div>

        {/* Voucher Code */}
        <div className="border-t pt-4">
          <VoucherCodeInput
            bookingAmount={calculateBasePrice()}
            providerId={packageData.provider_id}
            packageId={packageData.id}
            customerEmail={formData.customer_email}
            onVoucherApplied={(data) => setAppliedVoucher(data)}
            onVoucherRemoved={() => setAppliedVoucher(null)}
          />
        </div>

        <div className="space-y-3">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests
            </label>
            <textarea
              value={formData.special_requests}
              onChange={(e) =>
                setFormData({ ...formData, special_requests: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Any special requirements or requests..."
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Processing...' : 'Continue to Payment'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        You'll be redirected to secure payment
      </p>
    </form>
  );
}
