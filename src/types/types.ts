// Base API Response
export interface ApiResponse<T = any> {
  successful: boolean;
  error: string | null;
  data?: T;
}

// Authentication Types
export interface LoginRequest {
  userName: string;
  password: string;
  isPeristant?: boolean;
}

export interface LoginResponse {
  successful: boolean;
  error: string | null;
  token: string | null;
}

// JWT Claims Interface
export interface JwtClaims {
  [key: string]: any;
  // Standard JWT claims
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
  // Custom claims từ POS ONE
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/system'?: string; // CompanyName
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'?: string; // UserFullName
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string; // UserName
}

// User Info từ JWT
export interface UserInfo {
  companyName?: string;
  userFullName?: string;
  userName?: string;
}

export interface User {
  id: string;
  userName: string;
  email?: string;
  fullName?: string;
  role?: string;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

// Request Config
export interface ApiRequestConfig {
  requiresAuth?: boolean;
  retries?: number;
}

// Categories (Menu Types)
export interface Category {
  id: string;
  title: string;
  parentId?: string;
  exportMethod: number;
  vat: number;
  isSale: boolean;
}

// Products (Food Items)
export interface FileData {
  fileName?: string;
  fileContent?: string; // Keep for backward compatibility
  contentType?: string;
  // Add fields from actual API response
  base64data?: string;
  fileExtension?: string;
  filePath?: string;
  fullPath?: string;
  folder?: string;
  firstUpload?: boolean;
  lastUpload?: boolean;
  type?: number;
  uploadData?: any;
  uploadedBytes?: number;
}

export interface Product {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  price: number;
  priceAfterDiscount: number;
  discount: number;
  discountType: number;
  unitName: string;
  image?: FileData;
  isActive: boolean;
  isPublished: boolean;
  categoryOutputMethod: number;
}

export interface ProductsResponse {
  data: Product[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
}

// ===== ORDER CREATION & UPDATE TYPES =====

// Order Creation Request
export interface CreateOrderRequest {
  customerName: string;
  customerPhone?: string;
  tableId: string;
  products: OrderProductRequest[];
  note?: string;
  paymentMethod?: number; // 0=Tiền mặt, 1=Chuyển khoản
  priceIncludeVAT?: boolean;
  // Thông tin giảm giá
  discountType?: number; // 0: Không giảm, 1: %, 2: Số tiền, 3: Đến mức giá
  discount?: number; // Giá trị giảm giá
  discountVAT?: number; // Mức VAT được áp dụng giảm giá (0, 5, 8, 10)
  // Thông tin voucher
  voucher?: VoucherRequest;
}

// Order Product Request
export interface OrderProductRequest {
  productId: string;
  quantity: number;
  price: number;
  priceIncludeVAT?: number;
  note?: string;
  vat?: number; // Mức thuế VAT
}

// Order Update Request
export interface UpdateOrderRequest {
  customerName?: string;
  customerPhone?: string;
  note?: string;
  // Thông tin giảm giá
  discountType?: number;
  discount?: number;
  discountVAT?: number;
  // Thông tin voucher
  voucher?: VoucherRequest;
  // Sản phẩm (nếu cập nhật)
  products?: OrderProductRequest[];
}

// Voucher Request
export interface VoucherRequest {
  code: string;
  discount: number;
  discountType: number; // 1=%, 2=Số tiền
}

// Print Order Data
export interface PrintOrderData {
  orderCode: string;
  tableName: string;
  customerName: string;
  customerPhone?: string;
  areaName?: string;
  products: OrderDetailProduct[];
  totalAmount: number; // Tiền hàng trước thuế
  totalTaxAmount: number; // Tiền thuế
  totalPayableAmount: number; // Tổng phải thu
  discount: number;
  discountType: number;
  createDate: string;
  printDate: string;
  voucher?: VoucherExtended;
}

// Kitchen Print Data (Phiếu chế biến)
export interface KitchenPrintData {
  orderCode: string;
  tableName: string;
  areaName?: string;
  products: KitchenPrintProduct[];
  printDate: string;
  printGroupId?: string; // Nhóm in (bếp nóng, bếp lạnh, bar...)
}

// Kitchen Print Product
export interface KitchenPrintProduct {
  productName: string;
  quantity: number;
  note?: string;
  printGroupId: string;
  printGroupName: string;
}

// Order Creation Response
export interface CreateOrderResponse {
  successful: boolean;
  error?: string;
  data?: {
    id: string;
    code: string;
    tableId: string;
    createDate: string;
  };
}

// Order Detail Product (cần có cho PrintOrderData)
export interface OrderDetailProduct {
  id: string;
  productName: string;
  quantity: number;
  price: number; // Giá trước thuế
  priceIncludeVAT: number; // Giá sau thuế
  totalCost: number; // Tổng tiền trước thuế (Price * Quantity)
  totalCostInclideVAT: number; // Tổng tiền sau thuế (PriceIncludeVAT * Quantity)
  VAT: number; // Mức thuế VAT (0, 5, 8, 10)
  isConfirm: boolean;
  note?: string;
}

// Voucher Extended (cần có cho PrintOrderData)
export interface VoucherExtended {
  id: string;
  code: string;
  name: string;
  discount: number;
  discountType: number;
  fromDate: string;
  toDate: string;
  isActive: boolean;
} 