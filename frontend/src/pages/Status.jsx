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
      <h1 className="text-2xl font-bold mb-2">Status</h1>
      <div className="grid grid-cols-2 gap-2">
        {STATES.map((s) => (
          <button
            key={s.value}
            className="p-2 bg-blue-200 rounded"
            onClick={() => setCurrent(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {current && (
        <p className="mt-4">Current state: {current}</p>
      )}
    </div>
  );
}
