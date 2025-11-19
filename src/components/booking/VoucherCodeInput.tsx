'use client';

import { useState } from 'react';

interface VoucherCodeInputProps {
  bookingAmount: number;
  providerId?: string;
  tripId?: string;
  packageId?: string;
  customerEmail: string;
  onVoucherApplied: (voucherData: any) => void;
  onVoucherRemoved: () => void;
}

export default function VoucherCodeInput({
  bookingAmount,
  providerId,
  tripId,
  packageId,
  customerEmail,
  onVoucherApplied,
  onVoucherRemoved,
}: VoucherCodeInputProps) {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!code.trim()) return;

    if (!customerEmail) {
      setError('Please enter your email first');
      return;
    }

    setValidating(true);
    setError('');

    try {
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          customer_email: customerEmail,
          booking_amount: bookingAmount,
          provider_id: providerId,
          trip_id: tripId,
          package_id: packageId,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setAppliedVoucher(data);
        onVoucherApplied(data);
        setError('');
      } else {
        setError(data.error || 'Invalid voucher code');
        setAppliedVoucher(null);
      }
    } catch (err) {
      setError('Failed to validate voucher code');
      setAppliedVoucher(null);
    } finally {
      setValidating(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedVoucher(null);
    setError('');
    onVoucherRemoved();
  };

  if (appliedVoucher) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium text-green-900">
                Code Applied: {appliedVoucher.code || code.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-green-700">
              {appliedVoucher.code_type === 'voucher' ? (
                <>
                  Gift Voucher • €{appliedVoucher.value_used?.toFixed(2)} credit
                  used
                  {appliedVoucher.balance_after > 0 && (
                    <> • €{appliedVoucher.balance_after.toFixed(2)} remaining</>
                  )}
                </>
              ) : (
                <>
                  {appliedVoucher.discount_type === 'percentage'
                    ? `${appliedVoucher.discount_value}% off`
                    : `€${appliedVoucher.discount_value} off`}{' '}
                  • Save €{appliedVoucher.discount_amount.toFixed(2)}
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Promo Code or Gift Voucher
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder="Enter code"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
        />
        <button
          type="button"
          onClick={handleValidate}
          disabled={!code.trim() || validating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validating ? 'Checking...' : 'Apply'}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
