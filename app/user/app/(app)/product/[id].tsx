import { ProductDetailScreen } from '@/module/catalog/components/ProductDetailScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ProductDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = typeof id === 'string' ? id : '';

  return <ProductDetailScreen productId={productId} />;
}
