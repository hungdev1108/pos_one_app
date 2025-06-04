// API Configuration Constants
export const API_CONFIG = {
  BASE_URL: 'https://api-demo.posone.vn',
  TIMEOUT: 10000, // 10 seconds
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  REFRESH_TOKEN: '/api/refresh-token',
  
  // User Management
  USER_PROFILE: '/api/user/profile',
  
  // Products (for future use)
  PRODUCTS: '/api/products',
  
  // Orders (for future use)
  ORDERS: '/api/orders',
  
  // Reports (for future use)
  REPORTS: '/api/reports',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  IS_LOGGED_IN: 'isLoggedIn',
  USERNAME: 'username',
  IS_PERSISTENT: 'isPersistent',
} as const; 