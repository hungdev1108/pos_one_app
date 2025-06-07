import { OrderDetail, OrderListItem } from "@/api";

// Interface cho Button Visibility
export interface ButtonVisibility {
  // Buttons cho đơn hàng
  cancel?: boolean;           // Hủy đơn
  save?: boolean;             // Lưu đơn
  confirm?: boolean;          // Xác nhận
  send?: boolean;             // Gửi hàng/Tạm tính
  payment?: boolean;          // Thanh toán
  delete?: boolean;           // Xóa đơn
  
  // Buttons cho F&B
  printKitchen?: boolean;     // In chế biến
  printTemporary?: boolean;   // In tạm tính
  
  // Buttons cho sản phẩm
  addProduct?: boolean;       // Thêm sản phẩm
  removeProduct?: boolean;    // Xóa sản phẩm
  updateQuantity?: boolean;   // Thay đổi số lượng
}

export type OrderMode = 'create' | 'update';
export type OrderStatus = 'new' | 'confirmed' | 'sent' | 'completed' | 'cancelled';

export class ButtonVisibilityService {
  
  /**
   * Tính toán Button Visibility cho đơn hàng
   */
  getOrderButtonVisibility(
    order: OrderDetail | OrderListItem | any, 
    mode: OrderMode,
    products?: any[]
  ): ButtonVisibility {
    const visibility: ButtonVisibility = {};
    const safeOrder = order || {};
    
    // ĐIỀU KIỆN 1: Nếu đã thanh toán thì ẩn tất cả
    if (safeOrder.receiveDate) {
      return {};
    }
    
    // ĐIỀU KIỆN 2: Nếu đã hủy thì ẩn tất cả  
    if (safeOrder.cancelDate) {
      return {};
    }
    
    if (mode === 'create') {
      // Trạng thái: ĐƠN HÀNG MỚI (Create Mode)
      const hasProducts = products && products.length > 0;
      
      visibility.cancel = hasProducts;        // Hủy đơn
      visibility.save = hasProducts;          // Lưu đơn
      visibility.printKitchen = hasProducts;  // In chế biến (F&B)
      
      return visibility;
    }
    
    if (mode === 'update') {
      const status = this.getOrderStatus(safeOrder);
      
      switch (status) {
        case 'new':
          // Trạng thái: ĐƠN HÀNG MỚI (ConfirmDate == null)
          visibility.cancel = true;              // Hủy đơn
                     visibility.printKitchen = this.hasUnconfirmedProducts(safeOrder.products || products || []); // Có món chưa xác nhận
          visibility.printTemporary = true;      // In tạm tính
          visibility.payment = true;             // Thanh toán
          
          // Retail System
          visibility.delete = true;              // Xóa đơn
          visibility.send = true;                // Gửi hàng (SendDate == null)
          break;
          
        case 'confirmed':
          // Trạng thái: ĐÃ XÁC NHẬN (ConfirmDate != null && SendDate == null)
          visibility.cancel = true;              // Hủy đơn
          visibility.printTemporary = true;      // In tạm tính
          visibility.payment = true;             // Thanh toán
          
          // Retail System  
          visibility.delete = true;              // Xóa đơn
          visibility.send = true;                // Gửi hàng
          break;
          
        case 'sent':
          // Trạng thái: TẠM TÍNH (SendDate != null && ReceiveDate == null)
          visibility.cancel = true;              // Hủy đơn
          visibility.printTemporary = true;      // In tạm tính
          visibility.payment = true;             // Thanh toán
          
          // Retail System
          visibility.delete = true;              // Xóa đơn
          visibility.confirm = true;             // Xác nhận (SendDate != null)
          break;
          
        case 'completed':
          // Trạng thái: ĐÃ THANH TOÁN (ReceiveDate != null)
          // TẤT CẢ BUTTON ĐỀU ẨN
          return {};
          
        case 'cancelled':
          // Đơn hàng đã hủy - không hiển thị button nào
          return {};
          
        default:
          break;
      }
    }
    
    return visibility;
  }
  
  /**
   * Tính toán Button Visibility cho sản phẩm
   */
  getProductButtonVisibility(product: any, order: any): ButtonVisibility {
    // Đảm bảo product và order không undefined
    const safeProduct = product || {};
    const safeOrder = order || {};
    
    return {
      removeProduct: !safeProduct.isConfirm && !safeOrder.receiveDate,
      updateQuantity: this.canAddProduct(safeOrder) && !safeOrder.receiveDate,
      addProduct: this.canAddProduct(safeOrder) && !safeOrder.receiveDate
    };
  }
  
  /**
   * Kiểm tra trạng thái đơn hàng
   */
  getOrderStatus(order: any): OrderStatus {
    const safeOrder = order || {};
    if (safeOrder.cancelDate) return 'cancelled';
    if (safeOrder.receiveDate) return 'completed';
    if (safeOrder.sendDate) return 'sent';
    if (safeOrder.confirmDate) return 'confirmed';
    return 'new';
  }
  
  /**
   * Kiểm tra có món chưa xác nhận chế biến không
   */
  private hasUnconfirmedProducts(products: any[]): boolean {
    return products?.some(p => !p.isConfirm) || false;
  }
  
  /**
   * Kiểm tra có thể thêm sản phẩm không
   */
  canAddProduct(order: any): boolean {
    const safeOrder = order || {};
    
    // Mặc định cho phép thêm sản phẩm trừ khi đơn hàng đã hoàn thành hoặc hủy
    if (safeOrder.receiveDate || safeOrder.cancelDate) {
      return false;
    }
    
    // Có thể thêm logic phức tạp hơn tùy theo business rule
    // Ví dụ: không cho thêm sản phẩm sau khi đã gửi bếp
    return safeOrder.isAddProduct !== false; // Default true unless explicitly disabled
  }
}

/**
 * Validation Rules cho Mobile
 */
export class OrderValidationService {
  
  canExecuteAction(order: any, action: string): { can: boolean, reason?: string } {
    const safeOrder = order || {};
    
    // Rule 1: Đơn hàng đã hoàn thành
    if (safeOrder.receiveDate) {
      return { can: false, reason: 'Đơn hàng đã hoàn thành' };
    }
    
    // Rule 2: Đơn hàng đã hủy
    if (safeOrder.cancelDate) {
      return { can: false, reason: 'Đơn hàng đã bị hủy' };
    }
    
    switch (action) {
            case 'confirm':
        if (safeOrder.confirmDate) {
          return { can: false, reason: 'Đơn hàng đã được xác nhận' };
        }
        if (!safeOrder.products || safeOrder.products.length === 0) {
          return { can: false, reason: 'Đơn hàng chưa có sản phẩm' };
        }
        break;
        
      case 'send':
        if (safeOrder.sendDate) {
          return { can: false, reason: 'Đơn hàng đã được gửi' };
        }
        break;
        
      case 'payment':
        if (!safeOrder.products || safeOrder.products.length === 0) {
          return { can: false, reason: 'Đơn hàng chưa có sản phẩm' };
        }
        break;
        
      case 'addProduct':
        const buttonService = new ButtonVisibilityService();
        if (!buttonService.canAddProduct(safeOrder)) {
          return { can: false, reason: 'Không thể thêm sản phẩm vào đơn hàng này' };
        }
        break;
        
      case 'removeProduct':
        // Logic riêng cho từng sản phẩm
        break;
    }
    
    return { can: true };
  }
}

// Export instance để sử dụng
export const buttonVisibilityService = new ButtonVisibilityService();
export const orderValidationService = new OrderValidationService(); 