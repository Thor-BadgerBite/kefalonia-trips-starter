'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import VoucherForm from './VoucherForm';

interface Voucher {
  id: string;
  code: string;
  code_type: string;
  discount_type: string;
  discount_value: number;
  original_value: number | null;
  remaining_value: number | null;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  active: boolean;
  description: string | null;
  total_discount_given: number;
  voucher_uses: { count: number }[];
}

interface VouchersManagerProps {
  providerId: string;
  initialVouchers: Voucher[];
  availableTrips: any[];
  availablePackages: any[];
}

export default function VouchersManager({
  providerId,
  initialVouchers,
  availableTrips,
  availablePackages,
}: VouchersManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'vouchers' | 'promos'>('all');

  const handleToggleActive = async (voucherId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('vouchers')
      .update({ active: !currentStatus })
      .eq('id', voucherId);

    if (!error) {
      setVouchers(
        vouchers.map((v) =>
          v.id === voucherId ? { ...v, active: !currentStatus } : v
        )
      );
    }
  };

  const handleDelete = async (voucherId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this code? This cannot be undone.'
      )
    )
      return;

    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', voucherId);

    if (!error) {
      setVouchers(vouchers.filter((v) => v.id !== voucherId));
    }
  };

  const handleFormClose = () => {
    setShowCreateModal(false);
    setEditingVoucher(null);
    router.refresh();
  };

  const formatDiscount = (voucher: Voucher) => {
    if (voucher.code_type === 'voucher') {
      return `€${voucher.remaining_value?.toFixed(2)} / €${voucher.original_value?.toFixed(2)}`;
    }
    return voucher.discount_type === 'percentage'
      ? `${voucher.discount_value}%`
      : `€${voucher.discount_value}`;
  };

  const getCodeTypeBadgeColor = (type: string) => {
    return type === 'voucher'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700';
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'vouchers') return v.code_type === 'voucher';
    if (activeTab === 'promos') return v.code_type === 'promo';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vouchers & Promo Codes</h1>
          <p className="text-gray-600 mt-1">
            Create gift vouchers and promotional discount codes
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Code
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-blue-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Vouchers vs Promo Codes:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>
                <strong>Gift Vouchers:</strong> Pre-paid credit that customers can
                purchase and gift (has monetary value)
              </li>
              <li>
                <strong>Promo Codes:</strong> Discount codes for marketing
                campaigns (percentage or fixed amount off)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({vouchers.length})
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'vouchers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Gift Vouchers (
            {vouchers.filter((v) => v.code_type === 'voucher').length})
          </button>
          <button
            onClick={() => setActiveTab('promos')}
            className={`pb-3 px-1 border-b-2 font-medium transition ${
              activeTab === 'promos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Promo Codes (
            {vouchers.filter((v) => v.code_type === 'promo').length})
          </button>
        </div>
      </div>

      {/* Vouchers List */}
      {filteredVouchers.length > 0 ? (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-mono font-bold text-gray-900">
                          {voucher.code}
                        </div>
                        {voucher.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {voucher.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCodeTypeBadgeColor(
                          voucher.code_type
                        )}`}
                      >
                        {voucher.code_type === 'voucher'
                          ? 'Gift Voucher'
                          : 'Promo Code'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatDiscount(voucher)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {voucher.current_uses}
                          {voucher.max_uses && ` / ${voucher.max_uses}`}
                        </div>
                        {voucher.total_discount_given > 0 && (
                          <div className="text-xs text-gray-500">
                            €{voucher.total_discount_given.toFixed(2)} total
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {voucher.valid_until
                          ? new Date(voucher.valid_until).toLocaleDateString()
                          : 'No expiry'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          handleToggleActive(voucher.id, voucher.active)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          voucher.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {voucher.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setEditingVoucher(voucher)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(voucher.id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No codes yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create gift vouchers or promo codes to attract more customers
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Create Your First Code
          </button>
        </div>
      )}

      {/* Examples */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Common Use Cases</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">
              🎁 Gift Voucher
            </div>
            <p className="text-sm text-gray-600 mb-3">
              €100 prepaid voucher customers can purchase and gift to others
            </p>
            <div className="text-xs text-gray-500">
              Code: GIFT-XXXXX • Value: €100
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">
              🎯 Seasonal Promo
            </div>
            <p className="text-sm text-gray-600 mb-3">
              20% off summer bookings - limited time offer
            </p>
            <div className="text-xs text-gray-500">
              Code: SUMMER20 • Discount: 20%
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">
              👥 First-Time Customer
            </div>
            <p className="text-sm text-gray-600 mb-3">
              €15 off for new customers - one-time use
            </p>
            <div className="text-xs text-gray-500">
              Code: WELCOME15 • Discount: €15
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingVoucher) && (
        <VoucherForm
          providerId={providerId}
          availableTrips={availableTrips}
          availablePackages={availablePackages}
          existingVoucher={editingVoucher}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
