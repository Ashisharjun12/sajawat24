import { Icon } from '@/components/ui/icon';
import { Check, CheckCheck } from 'lucide-react-native';

type MessageReceiptIconProps = {
  status?: 'sent' | 'read';
};

export function MessageReceiptIcon({ status }: MessageReceiptIconProps) {
  if (!status) return null;
  if (status === 'read') {
    return <Icon as={CheckCheck} size={14} className="text-primary" />;
  }
  return <Icon as={Check} size={14} className="text-muted-foreground" />;
}
