import React from 'react';
import { ServingSize, ServingUnit, formatServingSize } from '../../utils/unitConversion';

interface ServingSizeSelectorProps {
  value: ServingSize;
  onChange: (serving: ServingSize) => void;
  foodDescription: string;
  compact?: boolean;
}

const QUICK_PRESETS: { label: string; serving: ServingSize }[] = [
  { label: '25g', serving: { amount: 25, unit: 'g' } },
  { label: '50g', serving: { amount: 50, unit: 'g' } },
  { label: '100g', serving: { amount: 100, unit: 'g' } },
  { label: '200g', serving: { amount: 200, unit: 'g' } },
  { label: '1/4 cup', serving: { amount: 0.25, unit: 'cup' } },
  { label: '1/2 cup', serving: { amount: 0.5, unit: 'cup' } },
  { label: '1 cup', serving: { amount: 1, unit: 'cup' } },
];

const UNITS: { value: ServingUnit; label: string }[] = [
  { value: 'g', label: 'g' },
  { value: 'oz', label: 'oz' },
  { value: 'cup', label: 'cup' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'tsp', label: 'tsp' },
  { value: 'ml', label: 'ml' },
];

export const ServingSizeSelector: React.FC<ServingSizeSelectorProps> = ({
  value,
  onChange,
  foodDescription,
  compact = false,
}) => {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value);
    if (!isNaN(amount) && amount > 0) {
      onChange({ ...value, amount });
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, unit: e.target.value as ServingUnit });
  };

  const handlePresetClick = (serving: ServingSize) => {
    onChange(serving);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value.amount}
          onChange={handleAmountChange}
          min="0.1"
          step="0.1"
          className="w-20 bg-zinc-800 text-white text-sm px-2 py-1 rounded border border-zinc-700 focus:border-green-500 focus:outline-none"
        />
        <select
          value={value.unit}
          onChange={handleUnitChange}
          className="bg-zinc-800 text-white text-sm px-2 py-1 rounded border border-zinc-700 focus:border-green-500 focus:outline-none"
        >
          {UNITS.map(unit => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Amount and Unit Inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1">Amount</label>
          <input
            type="number"
            value={value.amount}
            onChange={handleAmountChange}
            min="0.1"
            step="0.1"
            className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-green-500 focus:outline-none"
            placeholder="100"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1">Unit</label>
          <select
            value={value.unit}
            onChange={handleUnitChange}
            className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-green-500 focus:outline-none"
          >
            {UNITS.map(unit => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="block text-xs text-zinc-400 mb-2">Quick Presets</label>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset.serving)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                value.amount === preset.serving.amount && value.unit === preset.serving.unit
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current Selection Display */}
      <div className="text-xs text-zinc-500 text-center">
        Serving: {formatServingSize(value)}
      </div>
    </div>
  );
};
