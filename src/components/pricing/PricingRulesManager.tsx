'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PricingRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  priority: number;
  adjustment_type: string;
  adjustment_value: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  min_guests: number | null;
  max_guests: number | null;
  days_of_week: number[] | null;
  can_combine: boolean;
}

interface PricingRulesManagerProps {
  providerId: string;
  initialRules: PricingRule[];
  trips: { id: string; title: string; slug: string }[];
}

export default function PricingRulesManager({
  providerId,
  initialRules,
  trips,
}: PricingRulesManagerProps) {
  const supabase = createClient();
  const [rules, setRules] = useState<PricingRule[]>(initialRules);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const handleToggleActive = async (ruleId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('pricing_rules')
      .update({ active: !currentStatus })
      .eq('id', ruleId);

    if (!error) {
      setRules(rules.map(r => r.id === ruleId ? { ...r, active: !currentStatus } : r));
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;

    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', ruleId);

    if (!error) {
      setRules(rules.filter(r => r.id !== ruleId));
    }
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      seasonal: 'Seasonal',
      group_size: 'Group Size',
      early_bird: 'Early Bird',
      last_minute: 'Last Minute',
      day_of_week: 'Day of Week',
    };
    return labels[type] || type;
  };

  const getRuleTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      seasonal: 'bg-purple-100 text-purple-700',
      group_size: 'bg-blue-100 text-blue-700',
      early_bird: 'bg-green-100 text-green-700',
      last_minute: 'bg-orange-100 text-orange-700',
      day_of_week: 'bg-pink-100 text-pink-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dynamic Pricing Rules</h1>
          <p className="text-gray-600 mt-1">
            Set automated pricing adjustments based on seasonality, demand, and booking patterns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Rule
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How Dynamic Pricing Works:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Rules are applied in priority order (higher priority first)</li>
              <li>Multiple rules can be combined if marked as "combinable"</li>
              <li>Use positive values for markups, negative values for discounts</li>
              <li>Set min/max price constraints to avoid extreme pricing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rules List */}
      {rules.length > 0 ? (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rule Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adjustment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
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
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{rule.name}</div>
                        {rule.description && (
                          <div className="text-sm text-gray-500">{rule.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRuleTypeBadgeColor(rule.rule_type)}`}>
                        {getRuleTypeLabel(rule.rule_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className={rule.adjustment_value >= 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          {rule.adjustment_value > 0 ? '+' : ''}
                          {rule.adjustment_value}
                          {rule.adjustment_type === 'percentage' ? '%' : '€'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{rule.priority}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(rule.id, rule.active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rule.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {rule.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setEditingRule(rule)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
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
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No pricing rules yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first pricing rule to automatically adjust prices based on demand and seasonality
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Create Your First Rule
          </button>
        </div>
      )}

      {/* Quick Examples */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Common Pricing Strategies</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">🌞 Summer Peak Season</div>
            <p className="text-sm text-gray-600 mb-3">
              Increase prices by 30% during July-August when demand is highest
            </p>
            <div className="text-xs text-gray-500">
              Type: Seasonal • Adjustment: +30%
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">🎯 Early Bird Discount</div>
            <p className="text-sm text-gray-600 mb-3">
              Give 15% discount for bookings made 14+ days in advance
            </p>
            <div className="text-xs text-gray-500">
              Type: Early Bird • Adjustment: -15%
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">👥 Group Discount</div>
            <p className="text-sm text-gray-600 mb-3">
              Offer 10% discount for groups of 6 or more people
            </p>
            <div className="text-xs text-gray-500">
              Type: Group Size • Adjustment: -10%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
