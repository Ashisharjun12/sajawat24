import { ApplicationReviewSkeleton } from '@/module/application-review/components/ApplicationReviewSkeleton';
import { BlockedAccountContent } from '@/module/application-review/components/BlockedAccountContent';
import { useBlockedReview } from '@/module/application-review/hooks/use-blocked-review';
import { useAuthStore } from '@/store/auth.store';
import { Href, router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BlockedScreen() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const { refreshing, handleRefresh } = useBlockedReview();
  const isLoading = !hydrated || !user;
  const signOut = useAuthStore((s) => s.signOut);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(onboarding)/login-choice' as Href);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {isLoading ? (
        <ApplicationReviewSkeleton />
      ) : (
        <BlockedAccountContent
          refreshing={refreshing}
          signingOut={signingOut}
          onRefresh={handleRefresh}
          onSignOut={() => void handleSignOut()}
        />
      )}
    </SafeAreaView>
  );
}
