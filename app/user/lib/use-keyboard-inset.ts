import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/** Height of the on-screen keyboard (0 when hidden). */
export function useKeyboardInset(active = true) {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!active) {
      setInset(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      setInset(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setInset(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [active]);

  return inset;
}
