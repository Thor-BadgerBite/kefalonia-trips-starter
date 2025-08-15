'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BookingSheet({ tripSlug }:{ tripSlug: string }) {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [party, setParty] = useState(2);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { alert('Please pick a date'); return; }
    router.push(`/confirm?trip=${encodeURIComponent(tripSlug)}&date=${date}&time=${time}&party=${party}`);
  }

  return (
    <form onSubmit={submit} className="p-4 border rounded-2xl grid gap-3 bg-white shadow">
      <h4 className="text-lg font-semibold">Book this trip</h4>
      <label className="grid gap-1">
        <span className="text-sm text-gray-600">Date</span>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded px-3 py-2" required />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-gray-600">Start time</span>
        <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="border rounded px-3 py-2" />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-gray-600">Party size</span>
        <input type="number" min={1} max={20} value={party} onChange={e=>setParty(parseInt(e.target.value||'1'))} className="border rounded px-3 py-2" />
      </label>
      <button type="submit" className="mt-2 bg-blue-600 text-white rounded-xl py-2 font-medium hover:bg-blue-700">Continue</button>
      <p className="text-xs text-gray-500">Phase-1 demo only. No payment collected.</p>
    </form>
  );
}
