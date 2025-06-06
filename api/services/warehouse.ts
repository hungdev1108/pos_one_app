import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from '../client';
import { STORAGE_KEYS } from "../constants";
import { Category, Product } from '../types';
import { extractUserInfo } from "../utils/jwt";

export class WarehouseService {
  // Branch API is not available on this server, use general APIs
  // Set to true if server supports /api/warehouses/branches/{branchId}/* endpoints
  private branchApiAvailable: boolean = false;

  /**
   * Enable Branch API if server supports it
   * Call this method if you know the server has been updated to support branch-specific endpoints
   */
  enableBranchApi(): void {
    this.branchApiAvailable = true;
    console.log('✅ Branch API enabled');
  }

  /**
   * Disable Branch API (fallback to general APIs)
   */
  disableBranchApi(): void {
    this.branchApiAvailable = false;
    console.log('⚠️ Branch API disabled, using general APIs');
  }

  /**
   * Lấy BranchId từ JWT token
   */
  private async getBranchId(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        throw new Error('No access token found');
      }

      const userInfo = extractUserInfo(token);
      console.log('🏢 User info for warehouse:', userInfo?.branchId);
      return userInfo?.branchId || '5095d0bc-50c3-4023-89df-6843bcbef89a'; // ID mặc định
    } catch (error) {
      console.error('Error getting branch ID:', error);
      return null;
    }
  }

  /**
   * Lấy danh sách categories (danh mục thực đơn) có thể bán theo branch
   */
  async getCategoriesByBranch(branchId?: string): Promise<Category[]> {
    console.log('🍽️ Getting categories by branch...');
    
    // Nếu Branch API không available, dùng general API luôn
    if (!this.branchApiAvailable) {
      console.log('⚠️ Branch API not available, using general categories');
      return this.getCategories();
    }

    // Nếu không truyền branchId, tự động lấy từ token
    const targetBranchId = branchId || await this.getBranchId();
    
    if (!targetBranchId) {
      console.log('⚠️ No branch ID found, using general categories');
      return this.getCategories();
    }

    try {
      const response = await apiClient.get<Category[]>(
        `/api/warehouses/branches/${targetBranchId}/categories`
      );
      
      console.log('📋 Categories by branch response:', response);
      
      // Kiểm tra nếu response là array
      if (Array.isArray(response)) {
        console.log('✅ Categories by branch loaded:', response.length);
        return response;
      }
      
      // Nếu response có structure khác
      console.warn('⚠️ Unexpected categories response structure, using fallback');
      return this.getCategories();
    } catch (error: any) {
      console.log('⚠️ Branch categories API error, using general categories');
      // Mark API as unavailable for future calls
      this.branchApiAvailable = false;
      return this.getCategories();
    }
  }

  /**
   * Lấy danh sách sản phẩm (món ăn) có thể bán theo branch
   */
  async getProductsByBranch(branchId?: string, categoryId?: string): Promise<Product[]> {
    console.log('🍔 Getting products by branch:', branchId, 'category:', categoryId || 'all');
    
    // Nếu Branch API không available, dùng general API luôn
    if (!this.branchApiAvailable) {
      console.log('⚠️ Branch API not available, using general products');
      return this.getProducts(categoryId);
    }

    // Nếu không truyền branchId, tự động lấy từ token
    const targetBranchId = branchId || await this.getBranchId();
    
    if (!targetBranchId) {
      console.log('⚠️ No branch ID found, using general products');
      return this.getProducts(categoryId);
    }

    try {
      const params = new URLSearchParams({
        pageNumber: '1',
        pageSize: '0', // Lấy tất cả
        Type: '-1',
        IsSale: 'true', // Chỉ lấy sản phẩm có thể bán
      });

      if (categoryId) {
        params.append('categoryId', categoryId);
      }

      const response = await apiClient.get<any>(
        `/api/warehouses/branches/${targetBranchId}/products?${params.toString()}`
      );
      
      console.log('📦 Products by branch response:', response);
      
      // Kiểm tra các cấu trúc response có thể có
      if (response && response.data && Array.isArray(response.data)) {
        // Cấu trúc chuẩn: { data: Product[], totalRecords, ... }
        console.log('✅ Products by branch loaded (standard structure):', response.data.length);
        return response.data;
      } else if (Array.isArray(response)) {
        // Response trực tiếp là array
        console.log('✅ Products by branch loaded (direct array):', response.length);
        return response;
      } else if (response && response.items && Array.isArray(response.items)) {
        // Cấu trúc khác: { items: Product[] }
        console.log('✅ Products by branch loaded (items structure):', response.items.length);
        return response.items;
      } else {
        // Cấu trúc không mong đợi
        console.log('⚠️ Unexpected products response structure, using fallback');
        return this.getProducts(categoryId);
      }
    } catch (error: any) {
      console.log('⚠️ Branch products API error, using general products');
      // Mark API as unavailable for future calls
      this.branchApiAvailable = false;
      return this.getProducts(categoryId);
    }
  }

  /**
   * Lấy danh sách categories (danh mục thực đơn) có thể bán
   */
  async getCategories(): Promise<Category[]> {
    console.log('🍽️ Getting categories...');
    
    try {
      const response = await apiClient.get<Category[]>('/api/warehouses/categories/sales');
      
      console.log('📋 Categories response:', response);
      
      // Kiểm tra nếu response là array
      if (Array.isArray(response)) {
        console.log('✅ Categories loaded:', response.length);
        return response;
      }
      
      // Nếu response có structure khác
      console.warn('⚠️ Unexpected categories response structure:', response);
      return [];
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách sản phẩm (món ăn) có thể bán
   */
  async getProducts(categoryId?: string): Promise<Product[]> {
    console.log('🍔 Getting products for category:', categoryId || 'all');
    
    try {
      const params = new URLSearchParams({
        pageNumber: '1',
        pageSize: '0', // Lấy tất cả
        Type: '-1',
        IsSale: 'true', // Chỉ lấy sản phẩm có thể bán
      });

      if (categoryId) {
        params.append('CategoryId', categoryId);
      }

      const response = await apiClient.get<any>(`/api/warehouses/products?${params.toString()}`);
      
      console.log('📦 Products response:', response);
      
      // Kiểm tra các cấu trúc response có thể có
      if (response && response.data && Array.isArray(response.data)) {
        // Cấu trúc chuẩn: { data: Product[], totalRecords, ... }
        console.log('✅ Products loaded (standard structure):', response.data.length);
        return response.data;
      } else if (Array.isArray(response)) {
        // Response trực tiếp là array
        console.log('✅ Products loaded (direct array):', response.length);
        return response;
      } else if (response && response.items && Array.isArray(response.items)) {
        // Cấu trúc khác: { items: Product[] }
        console.log('✅ Products loaded (items structure):', response.items.length);
        return response.items;
      } else {
        // Cấu trúc không mong đợi
        console.warn('⚠️ Unexpected products response structure:', response);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }
  }
}

export const warehouseService = new WarehouseService();