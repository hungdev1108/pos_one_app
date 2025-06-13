# Orientation Management System

Hệ thống quản lý orientation tự động cho ứng dụng POS One App.

## Tính năng

- **Màn hình nhỏ (<720px)**: Chỉ cho phép xoay dọc (portrait)
- **Màn hình lớn (≥720px)**: Chỉ cho phép xoay ngang (landscape)
- **Tự động kiểm tra**: Theo dõi thay đổi kích thước màn hình
- **Modal cảnh báo**: Hiển thị khi cần xoay ngang thiết bị

## Cấu trúc Files

```
src/
├── hooks/
│   ├── useOrientationHandler.ts         # Hook cho Expo
│   └── useOrientationHandler.native.ts  # Hook cho React Native thuần
├── components/common/
│   ├── OrientationModal.tsx             # Modal cảnh báo
│   ├── OrientationProvider.tsx          # Provider wrapper
│   └── README_Orientation.md            # Tài liệu này
```

## Setup cho Expo (Hiện tại)

### 1. Dependencies đã cài
```bash
npm install expo-screen-orientation
```

### 2. Cấu hình app.json
```json
{
  "expo": {
    "orientation": "default"  // Changed from "portrait"
  }
}
```

### 3. Usage
OrientationProvider đã được wrap trong `app/_layout.tsx`, không cần setup thêm.

## Setup cho React Native Base (Sau khi eject)

### 1. Cài đặt dependencies
```bash
npm install react-native-orientation-locker
```

### 2. iOS Setup
```bash
cd ios && pod install
```

### 3. Android Setup
Nếu React Native < 0.60, cần manual linking.

### 4. Sử dụng file native
Rename hoặc thay thế:
- `useOrientationHandler.native.ts` → `useOrientationHandler.ts`
- Uncomment các dòng code có `Orientation.*`

## API Reference

### useOrientationHandler()

```typescript
const {
  width,           // Chiều rộng hiện tại
  height,          // Chiều cao hiện tại  
  isLandscape,     // Có phải landscape không
  shouldShowModal, // Có cần hiện modal không
  dismissModal,    // Function đóng modal
  updateOrientation // Function update thủ công
} = useOrientationHandler();
```

### OrientationModal Props

```typescript
interface OrientationModalProps {
  visible: boolean;    // Hiển thị modal
  onDismiss: () => void; // Callback khi đóng modal
}
```

## Tùy chỉnh

### Thay đổi breakpoint
Trong `useOrientationHandler.ts`, line 25:
```typescript
const isTabletSize = Math.max(width, height) >= 720; // Thay đổi 720
```

### Tùy chỉnh modal
Chỉnh sửa `OrientationModal.tsx`:
- Text content
- Styling
- Animation

### Disable cho một screen cụ thể
```typescript
// Trong component screen
const { unlockOrientation } = useOrientationHandler();

useFocusEffect(useCallback(() => {
  unlockOrientation(); // Unlock khi vào screen này
  return () => {
    // Re-lock khi rời khỏi screen
  };
}, []));
```

## Troubleshooting

### Modal không hiển thị
- Kiểm tra `shouldShowModal` value
- Đảm bảo OrientationProvider được wrap đúng vị trí

### Orientation không lock được
- Kiểm tra app.json có `"orientation": "default"`
- Trên Expo: Đảm bảo `expo-screen-orientation` đã cài
- Trên RN Base: Đảm bảo `react-native-orientation-locker` setup đúng

### Performance issue
- Hook đã optimize với `useCallback`
- Nếu vẫn lag, có thể debounce `updateOrientation`

## Future Enhancements

- [ ] Persist user preference (nếu user muốn tắt auto-rotate)
- [ ] Animation transitions khi orientation thay đổi
- [ ] Support cho foldable devices
- [ ] Orientation-aware layouts

## Testing

### Test Cases
1. **Phone Portrait**: Màn hình 375x667 → Should lock portrait, no modal
2. **Phone Landscape**: Màn hình 667x375 → Should auto-rotate to portrait  
3. **Tablet Portrait**: Màn hình 768x1024 → Should show modal, lock landscape
4. **Tablet Landscape**: Màn hình 1024x768 → Should lock landscape, no modal
5. **Resize/Rotation**: Thay đổi orientation → Should respond immediately

### Debug Mode
Uncomment console.log trong `useOrientationHandler.ts` để debug:
```typescript
console.log('Orientation update:', { width, height, isLandscape, isTabletSize, shouldShowModal });
``` 