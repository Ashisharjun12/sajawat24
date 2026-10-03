import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { View } from 'react-native';

type IndiaPhoneFieldProps<T extends FieldValues> = {
  label: string;
  nativeID: string;
  placeholder?: string;
  control: Control<T>;
  name: FieldPath<T>;
  error?: string;
  optional?: boolean;
  editable?: boolean;
};

export function IndiaPhoneField<T extends FieldValues>({
  label,
  nativeID,
  placeholder = 'Mobile number',
  control,
  name,
  error,
  optional,
  editable = true,
}: IndiaPhoneFieldProps<T>) {
  return (
    <View className="gap-2">
      <Label nativeID={nativeID}>
        {label}
        {optional ? ' (optional)' : ''}
      </Label>
      <View
        className={cn(
          'border-input bg-background flex-row items-center overflow-hidden rounded-xl border',
          editable === false && 'opacity-60',
        )}>
        <View className="flex-row items-center gap-2 pl-3.5 pr-2.5">
          <Text accessibilityLabel="India" style={{ fontSize: 22, lineHeight: 26 }}>
            🇮🇳
          </Text>
          <Text className="text-foreground text-base font-semibold">+91</Text>
        </View>
        <View className="bg-border h-7 w-px" />
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              nativeID={nativeID}
              placeholder={placeholder}
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              maxLength={10}
              editable={editable}
              className="h-12 flex-1 rounded-none border-0 bg-transparent px-3 shadow-none"
            />
          )}
        />
      </View>
      {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
    </View>
  );
}
