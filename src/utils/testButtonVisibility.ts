import { ButtonVisibilityService, OrderValidationService } from "@/src/services/buttonVisibilityService";

// Test cases cho Button Visibility Service
export function testButtonVisibilityService() {
  const buttonService = new ButtonVisibilityService();
  const validationService = new OrderValidationService();

  console.log("=== TEST BUTTON VISIBILITY SERVICE ===");

  // Test Case 1: Đơn hàng mới (Create Mode)
  console.log("\n1. CREATE MODE:");
  const createModeProducts = [
    { id: "1", title: "Cơm chiên", quantity: 2, price: 50000 }
  ];
  
  const createModeVisibility = buttonService.getOrderButtonVisibility(
    null,
    'create',
    createModeProducts
  );
  console.log("Create Mode Visibility:", createModeVisibility);

  // Test Case 2: Đơn hàng mới (không có sản phẩm)
  console.log("\n2. CREATE MODE (No Products):");
  const createModeEmptyVisibility = buttonService.getOrderButtonVisibility(
    null,
    'create',
    []
  );
  console.log("Create Mode Empty Visibility:", createModeEmptyVisibility);

  // Test Case 3: Đơn hàng đã lưu - trạng thái NEW
  console.log("\n3. UPDATE MODE - NEW ORDER:");
  const newOrder = {
    id: "order-1",
    createDate: "2024-01-01T10:00:00Z",
    confirmDate: null,
    sendDate: null,
    receiveDate: null,
    cancelDate: null,
    products: [
      { id: "p1", productName: "Cơm chiên", quantity: 2, isConfirm: false },
      { id: "p2", productName: "Phở bò", quantity: 1, isConfirm: true }
    ]
  };
  
  const newOrderVisibility = buttonService.getOrderButtonVisibility(
    newOrder,
    'update'
  );
  console.log("New Order Visibility:", newOrderVisibility);
  console.log("Order Status:", buttonService.getOrderStatus(newOrder));

  // Test Case 4: Đơn hàng đã xác nhận
  console.log("\n4. UPDATE MODE - CONFIRMED ORDER:");
  const confirmedOrder = {
    ...newOrder,
    confirmDate: "2024-01-01T10:05:00Z"
  };
  
  const confirmedOrderVisibility = buttonService.getOrderButtonVisibility(
    confirmedOrder,
    'update'
  );
  console.log("Confirmed Order Visibility:", confirmedOrderVisibility);
  console.log("Order Status:", buttonService.getOrderStatus(confirmedOrder));

  // Test Case 5: Đơn hàng đã gửi/tạm tính
  console.log("\n5. UPDATE MODE - SENT ORDER:");
  const sentOrder = {
    ...confirmedOrder,
    sendDate: "2024-01-01T10:10:00Z"
  };
  
  const sentOrderVisibility = buttonService.getOrderButtonVisibility(
    sentOrder,
    'update'
  );
  console.log("Sent Order Visibility:", sentOrderVisibility);
  console.log("Order Status:", buttonService.getOrderStatus(sentOrder));

  // Test Case 6: Đơn hàng đã thanh toán
  console.log("\n6. UPDATE MODE - COMPLETED ORDER:");
  const completedOrder = {
    ...sentOrder,
    receiveDate: "2024-01-01T10:15:00Z"
  };
  
  const completedOrderVisibility = buttonService.getOrderButtonVisibility(
    completedOrder,
    'update'
  );
  console.log("Completed Order Visibility:", completedOrderVisibility);
  console.log("Order Status:", buttonService.getOrderStatus(completedOrder));

  // Test Case 7: Đơn hàng đã hủy
  console.log("\n7. UPDATE MODE - CANCELLED ORDER:");
  const cancelledOrder = {
    ...newOrder,
    cancelDate: "2024-01-01T10:05:00Z"
  };
  
  const cancelledOrderVisibility = buttonService.getOrderButtonVisibility(
    cancelledOrder,
    'update'
  );
  console.log("Cancelled Order Visibility:", cancelledOrderVisibility);
  console.log("Order Status:", buttonService.getOrderStatus(cancelledOrder));

  // Test Validation Service
  console.log("\n=== VALIDATION TESTS ===");
  
  console.log("\nValidation - Add Product to New Order:");
  console.log(validationService.canExecuteAction(newOrder, 'addProduct'));
  
  console.log("\nValidation - Add Product to Completed Order:");
  console.log(validationService.canExecuteAction(completedOrder, 'addProduct'));
  
  console.log("\nValidation - Payment Empty Order:");
  const emptyOrder = { ...newOrder, products: [] };
  console.log(validationService.canExecuteAction(emptyOrder, 'payment'));
  
  console.log("\nValidation - Confirm Order Twice:");
  console.log(validationService.canExecuteAction(confirmedOrder, 'confirm'));

  // Test Product Button Visibility
  console.log("\n=== PRODUCT BUTTON VISIBILITY ===");
  
  const unconfirmedProduct = { id: "p1", isConfirm: false };
  const confirmedProduct = { id: "p2", isConfirm: true };
  
  console.log("\nUnconfirmed Product + New Order:");
  console.log(buttonService.getProductButtonVisibility(unconfirmedProduct, newOrder));
  
  console.log("\nConfirmed Product + New Order:");
  console.log(buttonService.getProductButtonVisibility(confirmedProduct, newOrder));
  
  console.log("\nUnconfirmed Product + Completed Order:");
  console.log(buttonService.getProductButtonVisibility(unconfirmedProduct, completedOrder));
}

// Export để có thể gọi từ component
export default testButtonVisibilityService; 