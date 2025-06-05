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

// Order List Item Interface
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
  price: number;
  totalCost: number;
  isConfirm: boolean;
  note?: string;
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