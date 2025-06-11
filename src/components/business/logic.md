src/components/business/
├── UnifiedOrderModal.tsx        # Modal chính cho xem/tạo/sửa đơn hàng
├── OrderBottomSheet.tsx         # Bottom sheet hiển thị thông tin đơn hàng
├── CustomerInfoModal.tsx        # Modal nhập thông tin khách hàng
├── OrdersView.tsx              # View hiển thị danh sách đơn hàng
├── AllCategoriesProductList.tsx # List sản phẩm theo danh mục
├── UserInfoCard.tsx            # Card hiển thị thông tin user
├── AreasTablesView.tsx         # View hiển thị khu vực và bàn
├── CategoryBottomSheet.tsx     # Bottom sheet chọn danh mục
├── PaymentModal.tsx            # Modal thanh toán
├── OrderActionButtons.tsx      # Buttons actions cho đơn hàng
├── ProductQuantityControls.tsx # Controls điều chỉnh số lượng sản phẩm
└── (12 files total)

## 🚀 LUỒNG THANH TOÁN MỚI ĐÃ TỐI ƯU (2024)

### Luồng cũ (đã bị comment):
1. Chọn bàn
2. Chọn món  
3. Bấm Thanh toán (OrderBottomSheet)
4. Chuyển sang tab Đơn hàng
5. Xem chi tiết đơn hàng
6. Bấm vào Thanh toán (trong chi tiết)
7. Mở màn hình thanh toán

❌ **Nhược điểm**: Nhiều thao tác, mất context, phải tìm đơn hàng

### Luồng mới tối ưu:
1. Chọn bàn
2. Chọn món
3. Bấm Thanh toán ➜ **Trực tiếp vào màn hình thanh toán**

✅ **Ưu điểm**: 
- Giảm từ 7 bước xuống 3 bước
- Không mất context người dùng
- Không cần chuyển tab hoặc tìm đơn hàng
- Tạo đơn hàng và in chế biến async (background)

### Cách thức hoạt động:

#### 1. UnifiedOrderModal.tsx
- Thêm interface `TempOrderData` để lưu thông tin tạm
- Thêm hàm `handleOptimizedPaymentFlow()` 
- Giữ lại hàm cũ `handlePaymentCreateFlow_OLD()` (đã comment)
- Action `payment_create` giờ gọi luồng mới

#### 2. home.tsx  
- Thêm state `paymentModalVisible` và `tempOrderData`
- Thêm hàm `handleDirectPayment()` để nhận thông tin tạm
- Thêm hàm `handlePaymentComplete()` để xử lý thanh toán
- Thêm `PaymentModal` riêng cho luồng mới
- Thêm props `onDirectPayment` cho UnifiedOrderModal

#### 3. Luồng chi tiết:
```
Bấm "Thanh toán" 
    ↓
Lưu thông tin vào biến tổng (TempOrderData)
    ↓
Tạo đơn hàng + In chế biến (async - background)
    ↓  
Clear form và reset trạng thái
    ↓
Chuyển thẳng sang PaymentModal với thông tin tạm
    ↓
Người dùng thanh toán ngay lập tức
```

### Tương thích ngược:
- Code cũ vẫn được giữ lại (có comment `_OLD`)
- Nếu parent chưa support `onDirectPayment`, sẽ fallback về luồng cũ
- Không ảnh hưởng đến các flow khác

### Files đã thay đổi:
- ✅ `src/components/business/UnifiedOrderModal.tsx`
- ✅ `src/screens/pos/home.tsx`  
- ✅ `src/components/business/logic.md` (file này)
