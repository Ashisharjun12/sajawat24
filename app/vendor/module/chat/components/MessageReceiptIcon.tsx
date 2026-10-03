import { Check, CheckCheck } from 'lucide-react-native';

const SENT_COLOR = '#9CA3AF';
const READ_COLOR = '#34B7F1';

type MessageReceiptIconProps = {
  status?: 'sent' | 'read';
};

export function MessageReceiptIcon({ status }: MessageReceiptIconProps) {
  if (!status) return null;
  if (status === 'read') {
    return <CheckCheck size={14} color={READ_COLOR} />;
  }
  return <Check size={14} color={SENT_COLOR} />;
}
