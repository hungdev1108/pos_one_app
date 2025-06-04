// Export API client
export { apiClient } from './client';

// Export services
export { AuthService, authService } from './services/auth';
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
    ApiResponse, Category, JwtClaims, LoginRequest,
    LoginResponse, Product,
    ProductsResponse, User,
    UserInfo
} from './types';

// Export constants
export { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from './constants';

// Export HTTP status codes
export { HttpStatus } from './types';
