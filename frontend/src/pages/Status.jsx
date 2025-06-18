import { useState } from 'react';

const STATES = [
  { label: 'Happy 😊', value: 'happy' },
  { label: 'Sad 😢', value: 'sad' },
  { label: 'Anxious 😰', value: 'anxious' },
  { label: 'Tired 😴', value: 'tired' },
  { label: 'In Crisis ⚠️', value: 'crisis' },
  { label: 'Custom 🔧', value: 'custom' },
];

export default function Status() {
  const [current, setCurrent] = useState(null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Update Status</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STATES.map((s) => (
          <button
            key={s.value}
            className={`p-4 rounded-lg border text-lg font-semibold transition-colors ${
              current === s.value
                ? 'bg-primary text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
            onClick={() => setCurrent(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {current && (
        <p className="mt-6 text-center text-primary">
          Current state: <span className="font-bold">{current}</span>
        </p>
      )}
    </div>
  );
}
