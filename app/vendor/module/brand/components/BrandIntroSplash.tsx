import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

/** Matches expo-splash-screen background in app.json */
export const BRAND_SPLASH_GREEN = '#0F766E';

const INTRO_GIF = require('../../../assets/images/sajawat.gif');

/**
 * Stop before the GIF loops again (sajawat.gif ≈ one cycle ~1.9s).
 * expo-image repeats GIFs until unmounted — keep this slightly under one loop.
 */
const INTRO_LOOP_MS = 1880;

type BrandIntroSplashProps = {
  onFinish: () => void;
};

export function BrandIntroSplash({ onFinish }: BrandIntroSplashProps) {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const finishedRef = useRef(false);
  const [showGif, setShowGif] = useState(true);

  useEffect(() => {
    const finishTimer = setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setShowGif(false);
      onFinishRef.current();
    }, INTRO_LOOP_MS);

    return () => clearTimeout(finishTimer);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {showGif ? (
        <Image
          key="sajawat-intro-once"
          source={INTRO_GIF}
          style={styles.image}
          contentFit="contain"
          transition={0}
          cachePolicy="memory"
          accessibilityLabel="Sajawat24"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_SPLASH_GREEN,
  },
  image: {
    width: '88%',
    height: '66%',
    maxWidth: 400,
    maxHeight: '72%',
  },
});
