# API Integration Documentation

## 📁 Cấu trúc Folder

```
api/
├── client.ts          # Axios client configuration với interceptors
├── constants.ts       # API URLs, endpoints và storage keys
├── types.ts          # TypeScript types cho requests/responses
├── index.ts          # Export tất cả API services và types
├── services/
│   └── auth.ts       # Authentication service
└── README.md         # Documentation này
```

## 🔧 Cấu hình

### Base URL
```typescript
BASE_URL: 'https://api-demo.posone.vn'
```

### Headers
- `Content-Type: application/json`
- `Authorization: Bearer {token}` (tự động thêm nếu có token)

## 🚀 Cách sử dụng

### 1. Import services
```typescript
import { authService, apiClient } from '@/api';
```

### 2. Authentication
```typescript
// Đăng nhập
const response = await authService.login({
  userName: 'username',
  password: 'password',
  isPeristant: true
});

// Kiểm tra đăng nhập
const isLoggedIn = await authService.isLoggedIn();

// Đăng xuất
await authService.logout();
```

### 3. API Calls khác
```typescript
// GET request
const data = await apiClient.get('/api/products');

// POST request
const result = await apiClient.post('/api/orders', orderData);
```

## 📝 API Endpoints hiện có

### Authentication
- `POST /api/login` - Đăng nhập
- `POST /api/logout` - Đăng xuất (planned)
- `POST /api/refresh-token` - Refresh token (planned)

### Future endpoints
- `GET /api/products` - Danh sách sản phẩm
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/reports` - Báo cáo

## 🔐 Token Management

Token được tự động:
- Lưu vào AsyncStorage khi đăng nhập thành công
- Thêm vào header Authorization cho các request
- Xóa khỏi storage khi logout hoặc token expired

## 🛠️ Error Handling

API client tự động xử lý:
- Network errors
- 401 Unauthorized (token expired)
- Server errors
- Request timeouts

## 📦 Storage Keys

```typescript
ACCESS_TOKEN = 'access_token'
IS_LOGGED_IN = 'isLoggedIn'
USERNAME = 'username'
IS_PERSISTENT = 'isPersistent'
```

## 🔄 Interceptors

### Request Interceptor
- Tự động thêm Bearer token
- Log request details

### Response Interceptor
- Log response details
- Handle token expiration
- Format error messages

## 🚀 Thêm Service mới

1. Tạo file trong `api/services/`
2. Export service trong `api/index.ts`
3. Thêm endpoints vào `constants.ts`
4. Thêm types vào `types.ts`

### Ví dụ Product Service:
```typescript
// api/services/product.ts
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../constants';

export class ProductService {
  async getProducts() {
    return await apiClient.get(API_ENDPOINTS.PRODUCTS);
  }
}

export const productService = new ProductService();
``` 