import { Dimensions, Platform } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';

const { width, height } = Dimensions.get('window');

// Device types
export enum DeviceType {
  IPHONE_NOTCH = 'iphone_notch',
  IPHONE_DYNAMIC_ISLAND = 'iphone_dynamic_island',
  IPHONE_CLASSIC = 'iphone_classic',
  ANDROID_CUTOUT = 'android_cutout',
  ANDROID_CLASSIC = 'android_classic',
}

// iPhone models với notch
const IPHONE_NOTCH_MODELS = [
  // iPhone X series dimensions
  { width: 375, height: 812 }, // iPhone X, XS
  { width: 414, height: 896 }, // iPhone XR, XS Max
  { width: 390, height: 844 }, // iPhone 12, 12 Pro
  { width: 428, height: 926 }, // iPhone 12 Pro Max
  { width: 375, height: 812 }, // iPhone 11 Pro
  { width: 414, height: 896 }, // iPhone 11, 11 Pro Max
];

// iPhone models với Dynamic Island
const IPHONE_DYNAMIC_ISLAND_MODELS = [
  { width: 393, height: 852 }, // iPhone 14 Pro
  { width: 430, height: 932 }, // iPhone 14 Pro Max
  { width: 393, height: 852 }, // iPhone 15 Pro
  { width: 430, height: 932 }, // iPhone 15 Pro Max
];

/**
 * Detect device type based on dimensions and platform
 */
export function getDeviceType(): DeviceType {
  if (Platform.OS === 'ios') {
    // Check for Dynamic Island iPhones
    const hasDynamicIsland = IPHONE_DYNAMIC_ISLAND_MODELS.some(
      model => model.width === width && model.height === height
    );
    if (hasDynamicIsland) return DeviceType.IPHONE_DYNAMIC_ISLAND;

    // Check for notch iPhones
    const hasNotch = IPHONE_NOTCH_MODELS.some(
      model => model.width === width && model.height === height
    );
    if (hasNotch) return DeviceType.IPHONE_NOTCH;

    return DeviceType.IPHONE_CLASSIC;
  } else {
    // Android detection based on status bar height and aspect ratio
    const statusBarHeight = getStatusBarHeight();
    const aspectRatio = height / width;
    
    // Most Android devices with camera cutouts have taller aspect ratios
    if (statusBarHeight > 24 && aspectRatio > 2.0) {
      return DeviceType.ANDROID_CUTOUT;
    }
    
    return DeviceType.ANDROID_CLASSIC;
  }
}

/**
 * Get optimized spacing for different device types
 */
export function getDeviceSpacing() {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case DeviceType.IPHONE_DYNAMIC_ISLAND:
      return {
        statusBarPadding: 54, // Extra space for Dynamic Island
        horizontalSafeArea: 8,
        bottomSafeArea: 34,
      };
    
    case DeviceType.IPHONE_NOTCH:
      return {
        statusBarPadding: 44, // Space for notch
        horizontalSafeArea: 8,
        bottomSafeArea: 34,
      };
    
    case DeviceType.ANDROID_CUTOUT:
      return {
        statusBarPadding: getStatusBarHeight() + 8,
        horizontalSafeArea: 12, // More space for side camera cutouts
        bottomSafeArea: 24,
      };
    
    default:
      return {
        statusBarPadding: getStatusBarHeight(),
        horizontalSafeArea: 8,
        bottomSafeArea: 16,
      };
  }
}

/**
 * Check if device has camera cutout or notch
 */
export function hasDisplayCutout(): boolean {
  const deviceType = getDeviceType();
  return [
    DeviceType.IPHONE_NOTCH,
    DeviceType.IPHONE_DYNAMIC_ISLAND,
    DeviceType.ANDROID_CUTOUT,
  ].includes(deviceType);
}

/**
 * Get optimized touch target size for device
 */
export function getTouchTargetSize(): number {
  // Larger touch targets for devices with cutouts (harder to reach)
  return hasDisplayCutout() ? 48 : 44;
}

/**
 * Get device-specific styling adjustments
 */
export function getDeviceStyles() {
  const spacing = getDeviceSpacing();
  const deviceType = getDeviceType();
  
  return {
    appBarHeight: spacing.statusBarPadding + 48,
    cardMargin: Math.max(16, spacing.horizontalSafeArea + 8),
    buttonHeight: getTouchTargetSize(),
    isModernDevice: hasDisplayCutout(),
    deviceType,
    spacing,
  };
} 