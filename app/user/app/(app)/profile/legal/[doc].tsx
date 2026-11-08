import { LegalPageScreen } from '@/module/account/components/LegalPageScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ProfileLegalRoute() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  return <LegalPageScreen doc={doc} />;
}
