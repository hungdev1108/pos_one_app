import { apiClient } from "../client";
import { ProductDetail } from "../types";

/**
 * Product Service
 * Quản lý các API liên quan đến sản phẩm
 */
class ProductService {
  private baseUrl = "/api/contents/products";

  /**
   * Lấy chi tiết sản phẩm theo ID
   * @param productId ID của sản phẩm
   * @param language Mã ngôn ngữ (mặc định "vi")
   * @returns Chi tiết sản phẩm
   */
  async getProductDetail(productId: string, language: string = "vi"): Promise<ProductDetail> {
    try {
      console.log(`🔍 Fetching product detail for ID: ${productId}, language: ${language}`);
      
      const response = await apiClient.get<ProductDetail>(
        `${this.baseUrl}/${productId}/${language}`
      );

      console.log("✅ Product detail response:", response);

      // Kiểm tra cấu trúc response
      if (response && response.id) {
        return response;
      }

      // Nếu response có cấu trúc { data: ProductDetail }
      if (response && (response as any).data && (response as any).data.id) {
        return (response as any).data;
      }

      throw new Error("Không tìm thấy thông tin sản phẩm");
    } catch (error: any) {
      console.error("❌ Error fetching product detail:", error);
      throw new Error(`Lỗi khi lấy chi tiết sản phẩm: ${error.message || error}`);
    }
  }
}

export const productService = new ProductService();
