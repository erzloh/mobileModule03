import { useEffect } from "react";
import { useNavigation } from "expo-router";

export function useTabSwipeLock() {
  const navigation = useNavigation();

  const disableTabSwipe = () => {
    navigation.setOptions({ swipeEnabled: false });
  };

  const enableTabSwipe = () => {
    navigation.setOptions({ swipeEnabled: true });
  };

  useEffect(() => {
    return () => {
      navigation.setOptions({ swipeEnabled: true });
    };
  }, [navigation]);

  return {
    disableTabSwipe,
    enableTabSwipe,
  };
}
