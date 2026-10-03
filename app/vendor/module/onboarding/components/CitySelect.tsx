import type { PublicCity } from '@/api/geo.api';
import { FormSelectField } from '@/module/onboarding/components/FormSelectField';
import { getCitiesByState } from '@/module/onboarding/lib/geo';
import { useMemo } from 'react';

type CitySelectProps = {
  state: string;
  value: string;
  cities: PublicCity[];
  onValueChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export function CitySelect({
  state,
  value,
  cities,
  onValueChange,
  error,
  disabled,
}: CitySelectProps) {
  const filtered = state ? getCitiesByState(state, cities) : [];
  const isDisabled = disabled || !state || filtered.length === 0;
  const selectedCity = filtered.find((city) => city.id === value);

  const options = useMemo(
    () => filtered.map((city) => ({ value: city.id, label: city.name })),
    [filtered]
  );

  const placeholder = !state
    ? 'Select state first'
    : filtered.length === 0
      ? 'No cities available'
      : 'Select a city';

  return (
    <FormSelectField
      label="City"
      value={value}
      placeholder={placeholder}
      options={options}
      onValueChange={onValueChange}
      error={error}
      disabled={isDisabled}
      selectedLabel={selectedCity?.name}
    />
  );
}
