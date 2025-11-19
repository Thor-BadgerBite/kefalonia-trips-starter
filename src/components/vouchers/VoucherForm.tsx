'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface VoucherFormProps {
  providerId: string;
  availableTrips: any[];
  availablePackages: any[];
  existingVoucher?: any;
  onClose: () => void;
}

export default function VoucherForm({
  providerId,
  availableTrips,
  availablePackages,
  existingVoucher,
  onClose,
}: VoucherFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: existingVoucher?.code || '',
    code_type: existingVoucher?.code_type || 'promo',
    discount_type: existingVoucher?.discount_type || 'percentage',
    discount_value: existingVoucher?.discount_value || '',
    original_value: existingVoucher?.original_value || '',
    min_purchase_amount: existingVoucher?.min_purchase_amount || '',
    valid_from: existingVoucher?.valid_from?.split('T')[0] || '',
    valid_until: existingVoucher?.valid_until?.split('T')[0] || '',
    max_uses: existingVoucher?.max_uses || '',
    max_uses_per_customer: existingVoucher?.max_uses_per_customer || 1,
    applicable_to: existingVoucher?.applicable_to || 'all',
    description: existingVoucher?.description || '',
    internal_notes: existingVoucher?.internal_notes || '',
    active: existingVoucher?.active ?? true,
  });

  const generateCode = async () => {
    const { data, error } = await supabase.rpc('generate_voucher_code', {
      p_prefix: formData.code_type === 'voucher' ? 'GIFT' : 'PROMO',
    });

    if (!error && data) {
      setFormData({ ...formData, code: data });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code) {
      alert('Please enter or generate a code');
      return;
    }

    setLoading(true);

    try {
      const voucherData = {
        provider_id: providerId,
        code: formData.code.toUpperCase(),
        code_type: formData.code_type,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        original_value:
          formData.code_type === 'voucher'
            ? parseFloat(formData.original_value)
            : null,
        remaining_value:
          formData.code_type === 'voucher'
            ? parseFloat(formData.original_value)
            : null,
        min_purchase_amount: formData.min_purchase_amount
          ? parseFloat(formData.min_purchase_amount)
          : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        max_uses_per_customer: formData.max_uses_per_customer,
        applicable_to: formData.applicable_to,
        description: formData.description || null,
        internal_notes: formData.internal_notes || null,
        active: formData.active,
      };

      if (existingVoucher) {
        const { error } = await supabase
          .from('vouchers')
          .update(voucherData)
          .eq('id', existingVoucher.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('vouchers').insert(voucherData);

        if (error) throw error;
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving voucher:', error);
      if (error.code === '23505') {
        alert('This code already exists. Please use a different code.');
      } else {
        alert('Failed to save voucher: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {existingVoucher ? 'Edit Code' : 'Create New Code'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Code Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, code_type: 'promo' })
                }
                className={`p-4 border-2 rounded-lg text-left transition ${
                  formData.code_type === 'promo'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold mb-1">Promo Code</div>
                <div className="text-sm text-gray-600">
                  Discount for marketing campaigns
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, code_type: 'voucher' })
                }
                className={`p-4 border-2 rounded-lg text-left transition ${
                  formData.code_type === 'voucher'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold mb-1">Gift Voucher</div>
                <div className="text-sm text-gray-600">
                  Prepaid credit for gifting
                </div>
              </button>
            </div>
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="SUMMER20"
                required
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Uppercase letters and numbers only
            </p>
          </div>

          {/* Discount Details */}
          {formData.code_type === 'voucher' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voucher Value (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.original_value}
                onChange={(e) =>
                  setFormData({ ...formData, original_value: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100.00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                The monetary value of this gift voucher
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, discount_type: 'percentage' })
                    }
                    className={`px-4 py-2 border-2 rounded-lg font-medium transition ${
                      formData.discount_type === 'percentage'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, discount_type: 'fixed' })
                    }
                    className={`px-4 py-2 border-2 rounded-lg font-medium transition ${
                      formData.discount_type === 'fixed'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Fixed Amount
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: e.target.value })
                    }
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      formData.discount_type === 'percentage' ? '20' : '15.00'
                    }
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    {formData.discount_type === 'percentage' ? '%' : '€'}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Minimum Purchase */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Purchase Amount (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.min_purchase_amount}
              onChange={(e) =>
                setFormData({ ...formData, min_purchase_amount: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for no minimum
            </p>
          </div>

          {/* Validity Period */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid From
              </label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) =>
                  setFormData({ ...formData, valid_from: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) =>
                  setFormData({ ...formData, valid_until: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Total Uses
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_uses}
                onChange={(e) =>
                  setFormData({ ...formData, max_uses: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Uses Per Customer *
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_uses_per_customer}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_uses_per_customer: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Applicable To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applicable To *
            </label>
            <select
              value={formData.applicable_to}
              onChange={(e) =>
                setFormData({ ...formData, applicable_to: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="all">All bookings</option>
              <option value="trips">Trips only</option>
              <option value="packages">Packages only</option>
              <option value="transfers">Transfers only</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Summer sale - 20% off all trips"
            />
            <p className="text-xs text-gray-500 mt-1">
              Visible to customers (optional)
            </p>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes
            </label>
            <textarea
              value={formData.internal_notes}
              onChange={(e) =>
                setFormData({ ...formData, internal_notes: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Private notes for your reference only..."
            />
          </div>

          {/* Active */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Active (customers can use this code)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Saving...'
                : existingVoucher
                ? 'Update Code'
                : 'Create Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
