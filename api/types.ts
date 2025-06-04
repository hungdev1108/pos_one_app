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