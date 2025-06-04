import { apiClient } from "@/api";
import { Category, Product } from "@/api/types";

export class WarehouseService {
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