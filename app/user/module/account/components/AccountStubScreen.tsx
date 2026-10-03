import { Text } from '@/components/ui/text';
import { AccountSubScreen } from '@/module/account/components/AccountSubScreen';

type AccountStubScreenProps = {
  title: string;
  description: string;
};

export function AccountStubScreen({ title, description }: AccountStubScreenProps) {
  return (
    <AccountSubScreen title={title}>
      <Text className="text-muted-foreground text-base leading-6">{description}</Text>
    </AccountSubScreen>
  );
}
