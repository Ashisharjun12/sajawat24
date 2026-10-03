import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { fromSelectOption, toSelectOption } from '@/module/onboarding/lib/select-value';
import { View } from 'react-native';

export type FormSelectOption = {
  value: string;
  label: string;
};

type FormSelectFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  options: FormSelectOption[];
  onValueChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  selectedLabel?: string;
};

export function FormSelectField({
  label,
  value,
  placeholder,
  options,
  onValueChange,
  error,
  disabled,
  selectedLabel,
}: FormSelectFieldProps) {
  return (
    <View className="w-full gap-2">
      <Label>{label}</Label>
      <View className="w-full">
        <Select
          value={toSelectOption(value, selectedLabel)}
          onValueChange={(option) => onValueChange(fromSelectOption(option))}
          disabled={disabled}>
          <SelectTrigger className="h-12 w-full rounded-xl px-3" disabled={disabled}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} label={option.label} />
            ))}
          </SelectContent>
        </Select>
      </View>
      {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
    </View>
  );
}
