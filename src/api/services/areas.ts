import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../client";
import { STORAGE_KEYS } from "../constants";
import {
  Area,
  Table
} from "../types";
import { extractUserInfo } from "../utils/jwt";

export class AreasService {
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
      // Giả sử BranchId được lưu trong claims, nếu không có thì cần điều chỉnh
      // Tạm thời sử dụng một ID mặc định hoặc có thể lấy từ user info
      // console.log('🏢 User info:', userInfo?.branchId);
      return userInfo?.branchId || '5095d0bc-50c3-4023-89df-6843bcbef89a'; // ID mặc định
    } catch (error) {
      console.error('Error getting branch ID:', error);
      return null;
    }
  }

  /**
   * Lấy danh sách khu vực và bàn
   */
  async getAreas(): Promise<Area[]> {
    // console.log('🏢 Getting areas and tables...');
    
    try {
      const branchId = await this.getBranchId();
      if (!branchId) {
        throw new Error('Branch ID not found');
      }

      const response = await apiClient.get<Area[]>(
        `/api/orders/areas/branches/${branchId}`
      );
      
      // console.log('🏢 Areas response:', response);
      
      if (Array.isArray(response)) {
        // Sắp xếp theo priority
        const sortedAreas = response.sort((a, b) => a.priority - b.priority);
        
        // Sắp xếp tables trong mỗi area theo priority
        sortedAreas.forEach(area => {
          if (area.tables) {
            area.tables.sort((a, b) => a.priority - b.priority);
          }
        });

        // console.log('✅ Areas loaded:', sortedAreas.length);
        return sortedAreas;
      } else {
        console.warn('⚠️ Areas response is not an array:', response);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching areas:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết một khu vực
   */
  async getAreaDetail(areaId: string): Promise<Area | null> {
    // console.log('🏢 Getting area detail:', areaId);
    
    try {
      const response = await apiClient.get<Area>(
        `/api/orders/areas/${areaId}`
      );
      
      // console.log('🏢 Area detail response:', response);
      
      if (response && typeof response === 'object') {
        // Sắp xếp tables theo priority
        if (response.tables) {
          response.tables.sort((a, b) => a.priority - b.priority);
        }

        // console.log('✅ Area detail loaded:', response.name);
        return response;
      } else {
        console.warn('⚠️ Area detail response not valid:', response);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching area detail:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách bàn theo khu vực
   */
  async getTablesByArea(areaId: string): Promise<Table[]> {
    // console.log('🪑 Getting tables by area:', areaId);
    
    try {
      const branchId = await this.getBranchId();
      if (!branchId) {
        throw new Error('Branch ID not found');
      }

      const response = await apiClient.get<Table[]>(
        `/api/orders/tables/branches/${branchId}/areas/${areaId}`
      );
      
      // console.log('🪑 Tables response:', response);
      
      if (Array.isArray(response)) {
        // Sắp xếp theo priority
        const sortedTables = response.sort((a, b) => a.priority - b.priority);

        // console.log('✅ Tables loaded:', sortedTables.length);
        return sortedTables;
      } else {
        console.warn('⚠️ Tables response is not an array:', response);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching tables:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết một bàn
   */
  async getTableDetail(tableId: string): Promise<Table | null> {
    // console.log('🪑 Getting table detail:', tableId);
    
    try {
      const response = await apiClient.get<Table>(
        `/api/orders/tables/${tableId}`
      );
      
      // console.log('🪑 Table detail response:', response);
      
      if (response && typeof response === 'object') {
        // console.log('✅ Table detail loaded:', response.name);
        return response;
      } else {
        console.warn('⚠️ Table detail response not valid:', response);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching table detail:', error);
      throw error;
    }
  }

  /**
   * Lấy số lượng bàn trống và có khách
   */
  getTableStats(areas: Area[]): { available: number; occupied: number; total: number } {
    let available = 0;
    let occupied = 0;
    let total = 0;

    areas.forEach(area => {
      if (area.tables) {
        area.tables.forEach(table => {
          total++;
          if (table.status === 0) { // Available
            available++;
          } else if (table.status === 1) { // Occupied
            occupied++;
          }
        });
      }
    });

    return { available, occupied, total };
  }
}

export const areasService = new AreasService(); 