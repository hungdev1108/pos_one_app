import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from './constants';
import { ApiError, HttpStatus } from './types';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor để thêm token vào header
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });
        
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor để xử lý response và error
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('✅ API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      async (error) => {
        console.error('❌ API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });

        // Handle 401 Unauthorized - Token expired
        if (error.response?.status === HttpStatus.UNAUTHORIZED) {
          await this.handleTokenExpired();
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private async handleTokenExpired() {
    console.log('🔄 Token expired, clearing storage...');
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.IS_LOGGED_IN,
      STORAGE_KEYS.USER_INFO,
    ]);
    
    // Redirect to login screen sẽ được handle bởi app navigation
  }

  private formatError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.error || error.response.data?.message || 'Đã xảy ra lỗi từ server',
        code: error.response.status.toString(),
        details: error.response.data,
      };
    } else if (error.request) {
      // Request was made but no response
      return {
        message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
        code: 'NETWORK_ERROR',
        details: error.request,
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'Đã xảy ra lỗi không xác định',
        code: 'UNKNOWN_ERROR',
        details: error,
      };
    }
  }

  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  // POST request
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  // PUT request
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  // Get instance for custom requests
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Export singleton instance
export const apiClient = new ApiClient(); 