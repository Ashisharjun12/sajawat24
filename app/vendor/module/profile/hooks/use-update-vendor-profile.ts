import { patchVendorProfile } from '@/api/vendor.api';
import { uploadProfileAvatar } from '@/module/profile/lib/upload-profile-avatar';
import { useAuthStore } from '@/store/auth.store';
import { useMutation } from '@tanstack/react-query';

type UpdateProfileInput = {
  name: string;
  email: string;
  localAvatarUri?: string | null;
};

export function useUpdateVendorProfile() {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: async ({ name, email, localAvatarUri }: UpdateProfileInput) => {
      let avatarUploadId: string | undefined;
      if (localAvatarUri) {
        avatarUploadId = await uploadProfileAvatar(localAvatarUri);
      }
      const result = await patchVendorProfile({
        name: name.trim(),
        email: email.trim(),
        avatarUploadId,
      });
      return result.user;
    },
    onSuccess: (user) => {
      updateUser(user);
    },
  });
}
