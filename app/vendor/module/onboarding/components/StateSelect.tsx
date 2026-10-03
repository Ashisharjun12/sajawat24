import { FormSelectField } from '@/module/onboarding/components/FormSelectField';
import { useMemo } from 'react';

type StateSelectProps = {
  value: string;
  states: string[];
  onValueChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export function StateSelect({
  value,
  states,
  onValueChange,
  error,
  disabled,
}: StateSelectProps) {
  const options = useMemo(
    () => states.map((state) => ({ value: state, label: state })),
    [states]
  );

  return (
    <FormSelectField
      label="State"
      value={value}
      placeholder="Select a state"
      options={options}
      onValueChange={onValueChange}
      error={error}
      disabled={disabled}
    />
  );
}
