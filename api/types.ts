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
  branchId?: string;
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

// Areas & Tables Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface Unit {
  id: string;
  name: string;
}

export interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  totalCost: number;
  totalCostInclideVAT: number;
  unit: Unit;
}

export interface Order {
  id: string;
  code: string;
  tableId: string;
  createDate: string;
  customer?: Customer;
  products: OrderProduct[];
}

export interface Table {
  id: string;
  name: string;
  priority: number;
  status: TableStatus;
  order?: Order;
}

export interface Area {
  id: string;
  name: string;
  priority: number;
  tables: Table[];
}

export enum TableStatus {
  Available = 0,
  Occupied = 1,
}

// API Response Types
export interface AreasResponse {
  isSuccess: boolean;
  data: Area[];
  error?: string;
}

export interface AreaDetailResponse {
  isSuccess: boolean;
  data: Area;
  error?: string;
}

export interface TablesResponse {
  isSuccess: boolean;
  data: Table[];
  error?: string;
}

export interface TableDetailResponse {
  isSuccess: boolean;
  data: Table;
  error?: string;
}

// ===== ORDER SYSTEM TYPES FOR F&B =====

// Order Status Enum
export enum OrderStatus {
  NEW = "new",
  CONFIRM = "confirm", 
  SEND = "send",
  RECEIVE = "receive",
  CANCEL = "cancel"
}

// Voucher Interface
export interface Voucher {
  id: string;
  voucherCode: string;
  discount: number;
  discountIncludeVAT: number;
}

// Order List Item Interface (sử dụng Voucher interface mới ở dưới)
export interface OrderListItem {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  countProducts: number;
  totalPrice: number;
  date: string;
  exportWarehouse: boolean;
  voucher?: Voucher;
}

// Orders List Response
export interface OrdersListResponse {
  items: OrderListItem[];
  metaData: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
  };
}

// Orders Request Parameters
export interface OrdersRequestParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
}

// Order Detail Product
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

// Voucher Detail Interface
export interface VoucherDetail {
  id: string;
  DiscountBefortVAT: number; // Giảm giá trước VAT
  DiscountAfterVAT: number; // Giảm giá sau VAT
}

// Voucher Interface với Details
export interface VoucherExtended {
  id: string;
  voucherCode: string;
  discount: number;
  discountIncludeVAT: number;
  Details?: VoucherDetail[]; // Chi tiết giảm giá theo từng mức VAT
}

// Order Detail Interface
export interface OrderDetail {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  tableId?: string;
  tableName?: string;
  areaName?: string;
  products: OrderDetailProduct[];
  totalAmount: number;
  discount: number;
  totalPayableAmount: number;
  // Thông tin giảm giá
  DiscountType: number; // 0: Không giảm, 1: %, 2: Số tiền, 3: Đến mức giá
  Discount: number; // Giá trị giảm giá
  DiscountVAT: number; // Mức VAT được áp dụng giảm giá (0, 5, 8, 10)
  // Thông tin thuế
  PriceIncludeVAT: boolean; // Cờ xác định giá đã bao gồm VAT hay chưa
  LoaiThue: string; // "0": 0VAT, "1": NVAT
  // Thông tin voucher
  Voucher?: VoucherExtended;
  // Các ngày tháng
  createDate: string;
  confirmDate?: string;
  sendDate?: string;
  receiveDate?: string;
  cancelDate?: string;
}

// F&B Config Interface
export interface FnBConfig {
  LoaiHinhKinhDoanh: number; // 2 = F&B
  LoaiFnB: number; // 1 = Thanh toán tại quầy, 2 = Thanh toán tại bàn
  LoaiThue: number; // 0 = 0VAT, 1 = NVAT
}

// Config Response
export interface ConfigResponse {
  [key: string]: any;
  LoaiHinhKinhDoanh?: number;
  LoaiFnB?: number;
  LoaiThue?: number;
}

// API Response for Order Operations
export interface OrderOperationResponse {
  successful: boolean;
  error?: string;
  data?: any;
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