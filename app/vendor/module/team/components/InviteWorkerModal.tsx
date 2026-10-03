import { getApiError } from '@/api/client';
import { inviteTeamMember } from '@/api/team.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { IndiaPhoneField } from '@/module/onboarding/components/IndiaPhoneField';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Modal, Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

const inviteSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number'),
  displayName: z.string().trim().min(1, 'Name is required'),
});

type InviteForm = z.infer<typeof inviteSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function InviteWorkerModal({ open, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const sheetBottomPadding = Math.max(insets.bottom, 16);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    mode: 'onChange',
    defaultValues: { phone: '', displayName: '' },
  });

  useEffect(() => {
    if (!open) {
      reset({ phone: '', displayName: '' });
    }
  }, [open, reset]);

  const inviteMutation = useMutation({
    mutationFn: inviteTeamMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vendor-team'] });
      reset();
      onClose();
      Alert.alert('Invite sent', 'They can sign in as staff with this phone number.');
    },
    onError: (err) => Alert.alert('Could not invite', getApiError(err)),
  });

  function onInvite(values: InviteForm) {
    inviteMutation.mutate({
      phone: values.phone,
      displayName: values.displayName.trim(),
    });
  }

  const busy = isSubmitting || inviteMutation.isPending;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/45" onPress={busy ? undefined : onClose} />
          <View
            className="rounded-t-3xl bg-background px-5 pt-6"
            style={{ paddingBottom: sheetBottomPadding }}>
            <Text className="text-foreground text-center text-xl font-semibold">Add worker</Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm leading-5">
              We&apos;ll send an invite. They sign in with staff login using this number.
            </Text>

            <View className="mt-6 gap-4">
              <View className="gap-2">
                <Label nativeID="inviteWorkerName">Name</Label>
                <Controller
                  control={control}
                  name="displayName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      nativeID="inviteWorkerName"
                      placeholder="Worker name"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.displayName?.message ? (
                  <Text className="text-destructive text-sm">{errors.displayName.message}</Text>
                ) : null}
              </View>
              <IndiaPhoneField
                label="Phone"
                nativeID="inviteWorkerPhone"
                placeholder="Mobile number"
                control={control}
                name="phone"
                error={errors.phone?.message}
              />
            </View>

            <View className="mt-6 gap-3">
              <Button
                className="h-12 rounded-2xl"
                disabled={!isValid || busy}
                onPress={handleSubmit(onInvite)}>
                <Text>{busy ? 'Sending…' : 'Send invite'}</Text>
              </Button>
              <Button variant="outline" className="h-12 rounded-2xl" disabled={busy} onPress={onClose}>
                <Text>Cancel</Text>
              </Button>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
