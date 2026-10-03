import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

type ShopImageFieldProps = {
  value?: string;
  onChange: (uri: string | undefined) => void;
};

const PREVIEW_HEIGHT = 160;

export function ShopImageField({ value, onChange }: ShopImageFieldProps) {
  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload a shop image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  }

  return (
    <View className="gap-2">
      <Label>Shop image</Label>
      <Pressable
        onPress={handlePickImage}
        style={[styles.touchTarget, !value && styles.emptyTarget]}>
        {value ? (
          <View style={styles.previewFrame}>
            <Image
              key={value}
              source={{ uri: value }}
              style={styles.previewImage}
              contentFit="cover"
            />
          </View>
        ) : (
          <View className="items-center gap-2 px-4 py-6">
            <View className="bg-primary/15 items-center justify-center rounded-full p-3">
              <Icon as={Camera} className="text-foreground size-6" />
            </View>
            <Text className="text-foreground text-sm font-medium">Upload shop photo</Text>
            <Text className="text-muted-foreground text-center text-xs">
              Optional — tap to choose from gallery
            </Text>
          </View>
        )}
      </Pressable>
      {value ? (
        <Pressable onPress={() => onChange(undefined)}>
          <Text className="text-muted-foreground text-sm underline">Remove photo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E4E4E7',
    backgroundColor: 'rgba(245, 245, 245, 0.3)',
    overflow: 'hidden',
  },
  emptyTarget: {
    minHeight: 144,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFrame: {
    width: '100%',
    height: PREVIEW_HEIGHT,
    padding: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
});
