import { RejectedApplicationContent } from '@/module/application-review/components/RejectedApplicationContent';
import { RejectedApplicationSkeleton } from '@/module/application-review/components/RejectedApplicationSkeleton';
import { useRejectedReview } from '@/module/application-review/hooks/use-rejected-review';
import { useAuthStore } from '@/store/auth.store';
import { Href, router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RejectedScreen() {
  const { isLoading, refreshing, handleRefresh } = useRejectedReview();
  const startReapplyFromSession = useAuthStore((s) => s.startReapplyFromSession);
  const signOut = useAuthStore((s) => s.signOut);
  const [signingOut, setSigningOut] = useState(false);

  function handleReapply() {
    startReapplyFromSession();
    router.replace('/(onboarding)/register' as Href);
  }

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
        <RejectedApplicationSkeleton />
      ) : (
        <RejectedApplicationContent
          refreshing={refreshing}
          signingOut={signingOut}
          onRefresh={handleRefresh}
          onReapply={handleReapply}
          onSignOut={() => void handleSignOut()}
        />
      )}
    </SafeAreaView>
  );
}
