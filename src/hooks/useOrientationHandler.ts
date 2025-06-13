import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export interface OrientationState {
  width: number;
  height: number;
  isLandscape: boolean;
  shouldShowModal: boolean;
}

export const useOrientationHandler = () => {
  const [orientationState, setOrientationState] = useState<OrientationState>(() => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    const isTabletSize = Math.max(width, height) >= 720;
    
    // Đảm bảo initial state đúng logic: chỉ hiển thị modal cho tablet portrait
    const shouldShowModal = isTabletSize && !isLandscape;
    
    console.log('🏁 Initial Orientation State:', {
      width,
      height,
      isLandscape,
      isTabletSize,
      shouldShowModal,
      maxDimension: Math.max(width, height)
    });
    
    return {
      width,
      height,
      isLandscape,
      shouldShowModal,
    };
  });

  const updateOrientation = useCallback(async () => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    const isTabletSize = Math.max(width, height) >= 720;
    
    // Debug: Log thông tin orientation
    console.log('🔄 Orientation Debug:', {
      width,
      height,
      isLandscape,
      isTabletSize,
      maxDimension: Math.max(width, height)
    });
    
    // Kiểm tra nếu cần hiển thị modal cảnh báo
    // CHỈ hiển thị modal khi:
    // 1. Là màn hình lớn (>=720) 
    // 2. VÀ đang ở portrait
    // 3. SAFEGUARD: Không hiển thị cho màn hình quá nhỏ (mobile thông thường)
    const shouldShowModal = isTabletSize && !isLandscape && Math.max(width, height) >= 720;
    
    console.log('📱 Modal Decision:', {
      isTabletSize,
      isLandscape,
      shouldShowModal
    });
    
    setOrientationState({
      width,
      height,
      isLandscape,
      shouldShowModal,
    });

    try {
      if (isTabletSize) {
        // Màn hình lớn: force landscape
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } else {
        // Màn hình nhỏ: force portrait
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    } catch (error) {
      console.warn('Failed to lock screen orientation:', error);
    }
  }, []);

  const unlockOrientation = useCallback(async () => {
    try {
      await ScreenOrientation.unlockAsync();
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

    // Cleanup
    return () => {
      subscription?.remove();
      unlockOrientation();
    };
  }, [updateOrientation, unlockOrientation]);

  return {
    ...orientationState,
    dismissModal,
    updateOrientation,
  };
}; 