/**
 * Alternative implementation for React Native (post-eject)
 * Install: npm install react-native-orientation-locker
 * 
 * IMPORTANT: Cần cài đặt thêm:
 * npm install react-native-orientation-locker
 * 
 * Và follow setup instructions:
 * - iOS: cd ios && pod install
 * - Android: Manual linking nếu cần
 */

import { useCallback, useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
// import Orientation from 'react-native-orientation-locker';

export interface OrientationState {
  width: number;
  height: number;
  isLandscape: boolean;
  shouldShowModal: boolean;
}

export const useOrientationHandler = () => {
  const [orientationState, setOrientationState] = useState<OrientationState>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      isLandscape: width > height,
      shouldShowModal: false,
    };
  });

  const updateOrientation = useCallback(() => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    const isTabletSize = Math.max(width, height) >= 720;
    
    // Kiểm tra nếu cần hiển thị modal cảnh báo
    // Màn hình lớn (>=720) nhưng đang ở portrait
    const shouldShowModal = isTabletSize && !isLandscape;
    
    setOrientationState({
      width,
      height,
      isLandscape,
      shouldShowModal,
    });

    try {
      // Uncomment khi đã cài đặt react-native-orientation-locker
      /*
      if (isTabletSize) {
        // Màn hình lớn: force landscape
        Orientation.lockToLandscape();
      } else {
        // Màn hình nhỏ: force portrait
        Orientation.lockToPortrait();
      }
      */
    } catch (error) {
      console.warn('Failed to lock screen orientation:', error);
    }
  }, []);

  const unlockOrientation = useCallback(() => {
    try {
      // Uncomment khi đã cài đặt react-native-orientation-locker
      // Orientation.unlockAllOrientations();
    } catch (error) {
      console.warn('Failed to unlock screen orientation:', error);
    }
  }, []);

  const dismissModal = useCallback(() => {
    setOrientationState(prev => ({
      ...prev,
      shouldShowModal: false,
    }));
  }, []);

  useEffect(() => {
    // Set orientation on mount
    updateOrientation();

    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', updateOrientation);

    // Uncomment khi đã cài đặt react-native-orientation-locker
    /*
    // Listen for orientation changes
    Orientation.addOrientationListener(updateOrientation);
    */

    // Cleanup
    return () => {
      subscription?.remove();
      // Uncomment khi đã cài đặt react-native-orientation-locker
      /*
      Orientation.removeOrientationListener(updateOrientation);
      */
      unlockOrientation();
    };
  }, [updateOrientation, unlockOrientation]);

  return {
    ...orientationState,
    dismissModal,
    updateOrientation,
  };
}; 