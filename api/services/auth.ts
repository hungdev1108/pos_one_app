import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../client';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import { LoginRequest, LoginResponse, User, UserInfo } from '../types';
import { extractUserInfo, isTokenExpired } from '../utils/jwt';

export class AuthService {
  /**
   * Đăng nhập user
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.LOGIN,
        loginData
      );

      if (response.successful && response.token) {
        // Extract thông tin user từ JWT token
        const userInfo = extractUserInfo(response.token);
        
        // Lưu token và thông tin đăng nhập
        await this.saveAuthData(
          response.token, 
          loginData.userName, 
          loginData.isPeristant,
          userInfo
        );
      }

      return response;
    } catch (error: any) {
      // Xử lý lỗi và trả về format đúng
      return {
        successful: false,
        error: error.message || 'Đăng nhập thất bại',
        token: null,
      };
    }
  }

  /**
   * Đăng xuất user
   */
  async logout(): Promise<void> {
    try {
      // Có thể gọi API logout nếu backend yêu cầu
      // await apiClient.post(API_ENDPOINTS.LOGOUT);
      
      // Xóa tất cả dữ liệu auth khỏi storage
      await this.clearAuthData();
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn xóa dữ liệu local dù API call thất bại
      await this.clearAuthData();
    }
  }

  /**
   * Kiểm tra trạng thái đăng nhập
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      
      if (!token || isLoggedIn !== 'true') {
        return false;
      }

      // Kiểm tra token có expired không
      if (isTokenExpired(token)) {
        console.log('🔄 Token expired, clearing auth data...');
        await this.clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Check login status error:', error);
      return false;
    }
  }

  /**
   * Lấy token hiện tại
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  /**
   * Lấy username hiện tại
   */
  async getUsername(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USERNAME);
    } catch (error) {
      console.error('Get username error:', error);
      return null;
    }
  }

  /**
   * Lấy thông tin user từ JWT token
   */
  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (userInfoStr) {
        return JSON.parse(userInfoStr);
      }
      
      // Fallback: extract từ token nếu có
      const token = await this.getToken();
      if (token) {
        return extractUserInfo(token);
      }
      
      return null;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  /**
   * Kiểm tra có ghi nhớ đăng nhập không
   */
  async isPersistent(): Promise<boolean> {
    try {
      const isPersistent = await AsyncStorage.getItem(STORAGE_KEYS.IS_PERSISTENT);
      return isPersistent === 'true';
    } catch (error) {
      console.error('Check persistent error:', error);
      return false;
    }
  }

  /**
   * Lưu dữ liệu authentication
   */
  private async saveAuthData(
    token: string, 
    username: string, 
    isPersistent: boolean = false,
    userInfo: UserInfo | null = null
  ): Promise<void> {
    try {
      const dataToSave: [string, string][] = [
        [STORAGE_KEYS.ACCESS_TOKEN, token],
        [STORAGE_KEYS.IS_LOGGED_IN, 'true'],
        [STORAGE_KEYS.USERNAME, username],
        [STORAGE_KEYS.IS_PERSISTENT, isPersistent.toString()],
      ];

      // Lưu user info nếu có
      if (userInfo) {
        dataToSave.push([STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo)]);
      }

      await AsyncStorage.multiSet(dataToSave);

      console.log('✅ Auth data saved successfully', {
        username,
        isPersistent,
        hasUserInfo: !!userInfo,
        userInfo
      });
    } catch (error) {
      console.error('❌ Save auth data error:', error);
      throw error;
    }
  }

  /**
   * Xóa tất cả dữ liệu authentication
   */
  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.IS_LOGGED_IN,
        STORAGE_KEYS.USERNAME,
        STORAGE_KEYS.USER_INFO,
        STORAGE_KEYS.IS_PERSISTENT,
      ]);

      console.log('✅ Auth data cleared successfully');
    } catch (error) {
      console.error('❌ Clear auth data error:', error);
      throw error;
    }
  }

  /**
   * Refresh token (for future use)
   */
  async refreshToken(): Promise<boolean> {
    try {
      // Implementation sẽ phụ thuộc vào API backend
      // const response = await apiClient.post(API_ENDPOINTS.REFRESH_TOKEN);
      // return response.successful;
      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }

  /**
   * Get user profile (for future use)
   */
  async getUserProfile(): Promise<User | null> {
    try {
      // const response = await apiClient.get<User>(API_ENDPOINTS.USER_PROFILE);
      // return response;
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService(); 