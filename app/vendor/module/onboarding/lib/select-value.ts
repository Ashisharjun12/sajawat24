import type { Option } from '@/components/ui/select';

export function toSelectOption(value: string, label?: string): Option {
  if (!value) return undefined;
  return { value, label: label ?? value };
}

export function fromSelectOption(option: Option): string {
  return option?.value ?? '';
}
