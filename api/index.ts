// Export API client
export { apiClient } from './client';

// Export services
export { areasService } from './services/areas';
export { authService } from './services/auth';
export { ordersService } from "./services/orders";
export { warehouseService } from './services/warehouse';

// Export JWT utilities
export {
    decodeJwtToken,
    extractUserInfo, getTokenExpirationDate, isTokenExpired
} from './utils/jwt';

// Export types
export type {
    ApiError,
    ApiRequestConfig,
    ApiResponse, Area, AreaDetailResponse, AreasResponse, Category, ConfigResponse, Customer, FnBConfig, JwtClaims, LoginRequest,
    LoginResponse, Order, OrderDetail, OrderDetailProduct, OrderListItem, OrderOperationResponse, OrderProduct, OrdersListResponse,
    OrdersRequestParams,
    // New Order types
    OrderStatus, Product,
    ProductsResponse, Table, TableDetailResponse, TablesResponse, TableStatus, Unit, User,
    UserInfo, Voucher
} from './types';

// Export constants
export { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from './constants';

// Export HTTP status codes
export { HttpStatus } from './types';

