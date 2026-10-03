import { FormFieldSkeleton } from '@/module/onboarding/components/skeletons/FormFieldSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

export function RegisterLocationGeoSkeleton() {
  return (
    <>
      <FormFieldSkeleton labelWidthClassName="w-12" />
      <FormFieldSkeleton labelWidthClassName="w-10" />
    </>
  );
}

export function RegisterLocationFormSkeleton() {
  return (
    <View className="gap-5">
      <RegisterLocationGeoSkeleton />
      <FormFieldSkeleton fieldClassName="min-h-24 rounded-xl" labelWidthClassName="w-24" />
      <FormFieldSkeleton labelWidthClassName="w-16" />
      <View className="gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </View>
    </View>
  );
}
