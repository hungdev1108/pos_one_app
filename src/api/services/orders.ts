import { apiClient } from "../client";
import {
  CreateOrderRequest,
  CreateOrderResponse,
  FnBConfig,
  KitchenPrintData,
  OrderDetail,
  OrderListItem,
  OrderOperationResponse,
  OrderProductRequest,
  OrdersListResponse,
  OrdersRequestParams,
  PrintOrderData,
  ProductDetail,
  UpdateOrderRequest
} from "../types";
import { productService } from "./product";

/**
 * Orders Service cho F&B System
 * Quản lý đơn hàng theo từng trạng thái: Mới, Xác nhận, Phục vụ, Thanh toán, Hủy
 */
class OrdersService {
  private baseUrl = "/api/orders";
  private configUrl = "/api/warehouses/configs";

  // ===== LOAD CONFIGS =====
  /**
   * Lấy cấu hình F&B quan trọng
   */
  async getFnBConfigs(): Promise<FnBConfig> {
    try {
      const response = await apiClient.get<any>(
        `${this.configUrl}/list/LoaiHinhKinhDoanh,LoaiFnB,LoaiThue`
      );

      // Kiểm tra cấu trúc response
      console.log("🍽️ Config response:", response);
      
      // Kiểm tra nếu response trực tiếp chứa các giá trị cấu hình
      if (response && response.LoaiFnB && response.LoaiHinhKinhDoanh) {
        return {
          LoaiHinhKinhDoanh: Number(response.LoaiHinhKinhDoanh || "2"), // Default F&B
          LoaiFnB: Number(response.LoaiFnB || "1"), // Default thanh toán tại quầy
          LoaiThue: Number(response.LoaiThue || "0"), // Default 0% VAT
        };
      }
      
      // Nếu response có cấu trúc { data: { LoaiFnB, LoaiHinhKinhDoanh, LoaiThue } }
      if (response && response.data) {
        const config = response.data;
        return {
          LoaiHinhKinhDoanh: Number(config.LoaiHinhKinhDoanh || "2"), // Default F&B
          LoaiFnB: Number(config.LoaiFnB || "1"), // Default thanh toán tại quầy
          LoaiThue: Number(config.LoaiThue || "0"), // Default 0% VAT
        };
      }
      
      // Nếu response có cấu trúc { data: { data: { LoaiFnB, ... } } }
      if (response && response.data && response.data.data) {
        const config = response.data.data;
        return {
          LoaiHinhKinhDoanh: Number(config.LoaiHinhKinhDoanh || "2"),
          LoaiFnB: Number(config.LoaiFnB || "1"),
          LoaiThue: Number(config.LoaiThue || "0"),
        };
      }

      console.error("❌ Không tìm thấy cấu trúc cấu hình F&B hợp lệ:", response);
      throw new Error("Không thể lấy cấu hình F&B");
    } catch (error: any) {
      console.error("❌ Error loading F&B configs:", error);
      // Return default config if API fails
      return {
        LoaiHinhKinhDoanh: 2,
        LoaiFnB: 1,
        LoaiThue: 0,
      };
    }
  }

  // ===== LOAD ORDERS BY STATUS =====
  /**
   * Lấy danh sách đơn hàng mới (chưa xác nhận)
   */
  async getNewOrders(params: OrdersRequestParams): Promise<OrdersListResponse> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/news`,
        { params }
      );

      console.log("🔄 New orders response:", response);

      // Trường hợp 1: Phản hồi trực tiếp là OrdersListResponse
      if (response && response.items && Array.isArray(response.items)) {
        return response;
      }

      // Trường hợp 2: Phản hồi dạng { data: OrdersListResponse }
      if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
        return response.data;
      }

      // Trường hợp 3: Phản hồi dạng { data: { data: OrdersListResponse } }
      if (response && response.data && response.data.data && response.data.data.items) {
        return response.data.data;
      }

      console.error("❌ Cấu trúc phản hồi không hợp lệ cho đơn hàng mới:", response);
      throw new Error("Lỗi khi tải đơn hàng mới: Cấu trúc phản hồi không hợp lệ");
    } catch (error: any) {
      console.error("❌ Error loading new orders:", error);
      // Return empty response instead of throwing
      return {
        items: [],
        metaData: {
          currentPage: 1,
          totalPages: 0,
          pageSize: 15,
          totalCount: 0,
        },
      };
    }
  }

  /**
   * Lấy danh sách đơn hàng đã xác nhận
   */
  async getConfirmedOrders(
    params: OrdersRequestParams
  ): Promise<OrdersListResponse> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/confirms`,
        { params }
      );

      console.log("🔄 Confirmed orders response:", response);

      // Trường hợp 1: Phản hồi trực tiếp là OrdersListResponse
      if (response && response.items && Array.isArray(response.items)) {
        return response;
      }

      // Trường hợp 2: Phản hồi dạng { data: OrdersListResponse }
      if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
        return response.data;
      }

      // Trường hợp 3: Phản hồi dạng { data: { data: OrdersListResponse } }
      if (response && response.data && response.data.data && response.data.data.items) {
        return response.data.data;
      }

      console.error("❌ Cấu trúc phản hồi không hợp lệ cho đơn hàng đã xác nhận:", response);
      throw new Error("Lỗi khi tải đơn hàng đã xác nhận: Cấu trúc phản hồi không hợp lệ");
    } catch (error: any) {
      console.error("❌ Error loading confirmed orders:", error);
      return {
        items: [],
        metaData: {
          currentPage: 1,
          totalPages: 0,
          pageSize: 15,
          totalCount: 0,
        },
      };
    }
  }

  /**
   * Lấy danh sách đơn hàng tạm tính (đã phục vụ, chờ thanh toán)
   */
  async getSentOrders(params: OrdersRequestParams): Promise<OrdersListResponse> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/sends`,
        { params }
      );

      console.log("🔄 Sent orders response:", response);

      // Trường hợp 1: Phản hồi trực tiếp là OrdersListResponse
      if (response && response.items && Array.isArray(response.items)) {
        return response;
      }

      // Trường hợp 2: Phản hồi dạng { data: OrdersListResponse }
      if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
        return response.data;
      }

      // Trường hợp 3: Phản hồi dạng { data: { data: OrdersListResponse } }
      if (response && response.data && response.data.data && response.data.data.items) {
        return response.data.data;
      }

      console.error("❌ Cấu trúc phản hồi không hợp lệ cho đơn hàng tạm tính:", response);
      throw new Error("Lỗi khi tải đơn hàng tạm tính: Cấu trúc phản hồi không hợp lệ");
    } catch (error: any) {
      console.error("❌ Error loading sent orders:", error);
      return {
        items: [],
        metaData: {
          currentPage: 1,
          totalPages: 0,
          pageSize: 15,
          totalCount: 0,
        },
      };
    }
  }

  /**
   * Lấy danh sách đơn hàng đã thanh toán
   */
  async getReceivedOrders(
    params: OrdersRequestParams
  ): Promise<OrdersListResponse> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/receives`,
        { params }
      );

      console.log("🔄 Received orders response:", response);

      // Trường hợp 1: Phản hồi trực tiếp là OrdersListResponse
      if (response && response.items && Array.isArray(response.items)) {
        return response;
      }

      // Trường hợp 2: Phản hồi dạng { data: OrdersListResponse }
      if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
        return response.data;
      }

      // Trường hợp 3: Phản hồi dạng { data: { data: OrdersListResponse } }
      if (response && response.data && response.data.data && response.data.data.items) {
        return response.data.data;
      }

      console.error("❌ Cấu trúc phản hồi không hợp lệ cho đơn hàng đã thanh toán:", response);
      throw new Error("Lỗi khi tải đơn hàng đã thanh toán: Cấu trúc phản hồi không hợp lệ");
    } catch (error: any) {
      console.error("❌ Error loading received orders:", error);
      return {
        items: [],
        metaData: {
          currentPage: 1,
          totalPages: 0,
          pageSize: 15,
          totalCount: 0,
        },
      };
    }
  }

  /**
   * Lấy danh sách đơn hàng đã hủy
   */
  async getCancelledOrders(
    params: OrdersRequestParams
  ): Promise<OrdersListResponse> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/cancels`,
        { params }
      );

      console.log("🔄 Cancelled orders response:", response);

      // Trường hợp 1: Phản hồi trực tiếp là OrdersListResponse
      if (response && response.items && Array.isArray(response.items)) {
        return response;
      }

      // Trường hợp 2: Phản hồi dạng { data: OrdersListResponse }
      if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
        return response.data;
      }

      // Trường hợp 3: Phản hồi dạng { data: { data: OrdersListResponse } }
      if (response && response.data && response.data.data && response.data.data.items) {
        return response.data.data;
      }

      console.error("❌ Cấu trúc phản hồi không hợp lệ cho đơn hàng đã hủy:", response);
      throw new Error("Lỗi khi tải đơn hàng đã hủy: Cấu trúc phản hồi không hợp lệ");
    } catch (error: any) {
      console.error("❌ Error loading cancelled orders:", error);
      return {
        items: [],
        metaData: {
          currentPage: 1,
          totalPages: 0,
          pageSize: 15,
          totalCount: 0,
        },
      };
    }
  }

  // ===== ORDER DETAILS =====
  /**
   * Lấy chi tiết đơn hàng
   */
  async getOrderDetail(orderId: string): Promise<OrderDetail> {
    try {
      const response = await apiClient.get<OrderDetail>(
        `${this.baseUrl}/${orderId}/detail`
      );

      if (response && typeof response === 'object') {
        return response;
      }

      throw new Error("Lỗi khi tải chi tiết đơn hàng");
    } catch (error: any) {
      console.error("❌ Error loading order detail:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách sản phẩm trong đơn hàng
   */
  async getOrderProducts(orderId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/${orderId}/products`
      );

      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
        return response.data;
      }

      throw new Error("Lỗi khi tải sản phẩm đơn hàng");
    } catch (error: any) {
      console.error("❌ Error loading order products:", error);
      throw error;
    }
  }

  /**
   * Lấy sản phẩm chưa in (chế biến)
   */
  async getUnprintedProducts(orderId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/${orderId}/products/unprinted`
      );

      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
        return response.data;
      }

      throw new Error("Lỗi khi tải sản phẩm chưa in");
    } catch (error: any) {
      console.error("❌ Error loading unprinted products:", error);
      throw error;
    }
  }

  // ===== ORDER OPERATIONS =====
  /**
   * Xác nhận đơn hàng
   */
  async confirmOrder(orderId: string): Promise<OrderOperationResponse> {
    console.log("🔄 Confirm order:", orderId);
    try {
      const response = await apiClient.post<OrderOperationResponse>(
        `${this.baseUrl}/${orderId}/confirm`,
        {},
        {
          headers: {
            'x-http-method-override': 'PUT',
          },
        }
      );

      console.log("✅ Confirm order response:", response);
      
      // apiClient đã xử lý đặc biệt nếu response là rỗng
      if (response.successful) {
        return response;
      }

      throw new Error(response.error || "Lỗi khi xác nhận đơn hàng");
    } catch (error: any) {
      console.error("❌ Error confirming order:", error);
      throw error;
    }
  }

  /**
   * Gửi đơn hàng (phục vụ) - Logic đặc biệt cho F&B
   * - Nếu LoaiFnB = 1 (thanh toán tại quầy): tự động chuyển thành "đã thanh toán"
   * - Nếu LoaiFnB = 2 (thanh toán tại bàn): chuyển thành "tạm tính"
   */
  async sendOrder(orderId: string): Promise<OrderOperationResponse> {
    try {
      const response = await apiClient.put<OrderOperationResponse>(
        `${this.baseUrl}/${orderId}/send`
      );

      if (response.data?.successful) {
        return response.data;
      }

      throw new Error(response.data?.error || "Lỗi khi gửi đơn hàng");
    } catch (error: any) {
      console.error("❌ Error sending order:", error);
      throw error;
    }
  }

  /**
   * Thanh toán đơn hàng
   */
  async receiveOrder(orderId: string): Promise<OrderOperationResponse> {
    try {
      const response = await apiClient.put<OrderOperationResponse>(
        `${this.baseUrl}/${orderId}/receive`
      );

      if (response.data?.successful) {
        return response.data;
      }

      throw new Error(response.data?.error || "Lỗi khi thanh toán đơn hàng");
    } catch (error: any) {
      console.error("❌ Error receiving payment for order:", error);
      throw error;
    }
  }

  /**
   * Hủy đơn hàng
   */
  async cancelOrder(orderId: string): Promise<OrderOperationResponse> {
    try {
      const response = await apiClient.put<OrderOperationResponse>(
        `${this.baseUrl}/${orderId}/cancel`
      );

      if (response.data?.successful) {
        return response.data;
      }

      throw new Error(response.data?.error || "Lỗi khi hủy đơn hàng");
    } catch (error: any) {
      console.error("❌ Error cancelling order:", error);
      throw error;
    }
  }

  /**
   * Xóa đơn hàng
   */
  async deleteOrder(orderId: string): Promise<OrderOperationResponse> {
    try {
      const response = await apiClient.delete<OrderOperationResponse>(
        `${this.baseUrl}/${orderId}`
      );

      if (response.data?.successful) {
        return response.data;
      }

      throw new Error(response.data?.error || "Lỗi khi xóa đơn hàng");
    } catch (error: any) {
      console.error("❌ Error deleting order:", error);
      throw error;
    }
  }

  // ===== ORDER CREATION & MANAGEMENT =====
  /**
   * Tạo đơn hàng mới
   */
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      console.log('➕ Creating new order:', orderData);
      
      const response = await apiClient.post<any>(
        this.baseUrl,
        orderData
      );

      console.log('✅ Order created successfully:', response);

      // Kiểm tra nếu API trả về ID đơn hàng (number hoặc string)
      if (response && (typeof response === 'number' || typeof response === 'string')) {
        return {
          successful: true,
          data: {
            id: response.toString(),
            code: response.toString(),
            tableId: orderData.tableId,
            createDate: new Date().toISOString(),
          }
        };
      }

      // Kiểm tra format cũ với field successful
      if (response && response.successful) {
        return response;
      }

      // Kiểm tra nếu có data chứa ID
      if (response && response.data && (typeof response.data === 'number' || typeof response.data === 'string')) {
        return {
          successful: true,
          data: {
            id: response.data.toString(),
            code: response.data.toString(),
            tableId: orderData.tableId,
            createDate: new Date().toISOString(),
          }
        };
      }

      throw new Error(response?.error || "Lỗi khi tạo đơn hàng");
    } catch (error: any) {
      console.error("❌ Error creating order:", error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin đơn hàng
   */
  async updateOrder(orderId: string, orderData: UpdateOrderRequest): Promise<OrderOperationResponse> {
    try {
      console.log('🔄 Updating order:', orderId, orderData);
      
      const response = await apiClient.put<OrderOperationResponse>(
        `${this.baseUrl}/${orderId}`,
        orderData
      );

      console.log('✅ Order updated successfully:', response);

      if (response && response.successful) {
        return response;
      }

      throw new Error(response?.error || "Lỗi khi cập nhật đơn hàng");
    } catch (error: any) {
      console.error("❌ Error updating order:", error);
      throw error;
    }
  }

  /**
   * Thêm/cập nhật sản phẩm trong đơn hàng
   */
  async updateOrderProducts(orderId: string, products: OrderProductRequest[]): Promise<OrderOperationResponse> {
    try {
      console.log('🍽️ Updating order products:', orderId, products);
      
      const response = await apiClient.post<OrderOperationResponse>(
        `${this.baseUrl}/${orderId}/products`,
        { products },
        {
          headers: {
            'x-http-method-override': 'PUT',
          },
        }
      );

      console.log('✅ Order products updated successfully:', response);

      if (response && response.successful) {
        return response;
      }

      throw new Error(response?.error || "Lỗi khi cập nhật sản phẩm đơn hàng");
    } catch (error: any) {
      console.error("❌ Error updating order products:", error);
      throw error;
    }
  }

  /**
   * Xóa sản phẩm khỏi đơn hàng
   */
  async removeOrderProduct(orderId: string, productId: string): Promise<OrderOperationResponse> {
    try {
      console.log('➖ Removing product from order:', orderId, productId);
      
      const response = await apiClient.delete<OrderOperationResponse>(
        `${this.baseUrl}/${orderId}/products/${productId}`
      );

      console.log('✅ Product removed from order:', response);

      if (response.data?.successful) {
        return response.data;
      }

      throw new Error(response.data?.error || "Lỗi khi xóa sản phẩm khỏi đơn hàng");
    } catch (error: any) {
      console.error("❌ Error removing product from order:", error);
      throw error;
    }
  }

  /**
   * Cập nhật số lượng sản phẩm hiện có trong đơn hàng (thay vì thêm mới)
   * @param orderId ID đơn hàng
   * @param productId ID sản phẩm (OrderProduct.Id)
   * @param changeAmount Số lượng thay đổi (+1 để tăng, -1 để giảm)
   */
  async updateProductQuantityInOrder(orderId: string, productId: string, changeAmount: number): Promise<OrderOperationResponse> {
    try {
      console.log('📈 Updating product quantity in order:', orderId, productId, 'change:', changeAmount);

      // Lấy chi tiết đơn hàng để có thông tin sản phẩm hiện tại
      const orderDetail = await this.getOrderDetail(orderId);
      const existingProduct = orderDetail.products?.find(p => p.id === productId);
      
      if (!existingProduct) {
        throw new Error("Sản phẩm không tồn tại trong đơn hàng");
      }

      console.log('🔍 Existing product from order detail:', JSON.stringify(existingProduct, null, 2));

      // Tính số lượng mới dựa vào changeAmount
      const newQuantity = existingProduct.quantity + changeAmount;
      console.log(`📊 Current quantity: ${existingProduct.quantity}, Change: ${changeAmount}, New quantity: ${newQuantity}`);

      // Kiểm tra số lượng hợp lệ
      if (newQuantity <= 0) {
        console.log("⚠️ New quantity is 0 or negative, no action taken");
        return {
          successful: true,
          data: "No change - quantity would be zero or negative",
        };
      }

      // Lấy chi tiết sản phẩm từ API để có thông tin chính xác
      let productDetail: ProductDetail | null = null;
      let realProductId = productId;

      // Thử lấy order products để tìm productId thật
      try {
        const orderProducts = await this.getOrderProducts(orderId);
        console.log('📦 Order products raw data:', JSON.stringify(orderProducts, null, 2));
        
        const matchingProduct = orderProducts.find(p => p.id === productId);
        console.log('🎯 Matching product from order products:', JSON.stringify(matchingProduct, null, 2));
        
        if (matchingProduct && matchingProduct.productId) {
          realProductId = matchingProduct.productId;
          console.log('✅ Found real productId:', realProductId);
        } else {
          console.log('⚠️ No productId found in order products, trying other fields...');
          // Thử tìm trong các field khác
          if (matchingProduct && matchingProduct.warehouseProductId) {
            realProductId = matchingProduct.warehouseProductId;
            console.log('✅ Found warehouseProductId:', realProductId);
          } else if (matchingProduct && matchingProduct.WarehouseProductId) {
            realProductId = matchingProduct.WarehouseProductId;
            console.log('✅ Found WarehouseProductId:', realProductId);
          }
        }
      } catch (error) {
        console.log("⚠️ Could not get order products, using provided productId:", error);
      }

      try {
        productDetail = await productService.getProductDetail(realProductId);
        console.log("✅ Got product detail:", productDetail);
      } catch (error) {
        console.warn("⚠️ Could not fetch product detail, using existing info:", error);
        console.warn("🔍 Failed productId was:", realProductId);
      }

      // Sử dụng thông tin từ productDetail nếu có, fallback về existingProduct
      const productCode = productDetail?.code || existingProduct.productName || "DEFAULT_CODE";
      const productName = productDetail?.title || existingProduct.productName || "Sản phẩm";
      const unitName = productDetail?.unitName || "Cái";

      console.log('📋 Final product info:', {
        productCode,
        productName,
        unitName,
        realProductId,
        originalProductId: productId,
        changeAmount,
        newQuantity
      });

      // Chuẩn bị payload chính xác theo cấu trúc OrderProduct thực tế
      const payload = {
        id: existingProduct.id, // ✅ OrderProduct.Id từ đơn hàng hiện tại
        productId: realProductId, // ✅ WarehouseProduct.Id thực sự 
        productCode: productCode, // ✅ Mã sản phẩm thực từ API
        quantity: newQuantity, // ✅ Số lượng mới (sau khi tính changeAmount)
        price: existingProduct.price, // ✅ Giá trước thuế
        priceIncludeVAT: existingProduct.priceIncludeVAT, // ✅ Giá sau thuế
        unitName: unitName, // ✅ Đơn vị tính thực
        vat: existingProduct.VAT || 10, // ✅ % thuế VAT
        type: 1, // ✅ Loại sản phẩm
        unitId: null, // ✅ NULL là hợp lệ
        properties: null, // ✅ Properties
        campaignId: null, // ✅ Campaign ID
        name: productName, // ✅ Tên sản phẩm thực từ API
        // ❌ LOẠI BỎ các computed properties không cần thiết:
        // totalCost, totalCostInclideVAT, isConfirm, image, serials
      };

      console.log('📦 Final updateProductQuantityInOrder payload:', JSON.stringify(payload, null, 2));

      const response = await apiClient.post<OrderOperationResponse>(
        `${this.baseUrl}/${orderId}/products`,
        payload
      );

      console.log('✅ Product quantity updated:', response);
      console.log('📋 Payload sent to API - Final check:', {
        orderId,
        productId: payload.productId,
        orderProductId: payload.id,
        sentQuantity: payload.quantity,
        changeAmount,
        originalQuantity: existingProduct.quantity,
        calculatedNewQuantity: newQuantity
      });

      // API success case: status 200 với data có thể là empty string
      // Nếu không có error và response tồn tại, coi như thành công
      if (response && response.successful) {
        return response;
      }

      // Kiểm tra nếu response có status code thành công
      if (response && typeof response === 'object') {
        return {
          successful: true,
          data: response,
        };
      }

      // Nếu response là string rỗng hoặc primitive, vẫn coi như thành công
      return {
        successful: true,
        data: response,
      };
    } catch (error: any) {
      console.error("❌ Error updating product quantity:", error);
      throw error;
    }
  }

  /**
   * Thêm sản phẩm vào đơn hàng hiện có
   */
  async addProductToOrder(orderId: string, productData: {
    productId: string;
    quantity: number;
    price: number;
    priceIncludeVAT?: number;
    unitName: string;
    vat?: number;
    properties?: string;
    unitId?: string;
    campaignId?: string;
    serials?: string[];
    isSplit?: boolean;
    name?: string;
    productCode?: string;
  }): Promise<OrderOperationResponse> {
    try {
      console.log('➕ Adding product to existing order:', orderId, productData);

      // Generate unique GUID for new OrderProduct
      const generateGuid = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Calculate totals
      const totalCost = productData.price * productData.quantity;
      const totalCostInclideVAT = (productData.priceIncludeVAT || productData.price) * productData.quantity;

      // Chuẩn bị payload theo đúng format API - match với Postman success
      const payload = {
        id: generateGuid(), // Generate unique GUID thay vì fake GUID
        productId: productData.productId,
        productCode: productData.productCode || null, // Sử dụng productCode từ productData hoặc null
        quantity: productData.quantity,
        price: productData.price,
        properties: productData.properties || null,
        name: productData.name || null, // Sử dụng name từ productData hoặc null
        type: 0,
        unitId: null, // null thay vì fake GUID
        unitName: productData.unitName || "Cái",
        totalCost: totalCost,
        totalCostInclideVAT: totalCostInclideVAT,
        priceIncludeVAT: productData.priceIncludeVAT || productData.price,
        vat: productData.vat || 10,
        isConfirm: false,
        image: {
          base64data: null,
          contentType: null,
          uploadedBytes: 0,
          uploadData: null,
          firstUpload: true,
          lastUpload: false,
          fileName: null,
          folder: null,
          type: 11,
          filePath: null,
          fullPath: null,
          fileExtension: null
        },
        serials: productData.serials || [],
        campaignId: productData.campaignId || null,
      };

      console.log('📦 Final addProductToOrder payload:', JSON.stringify(payload, null, 2));

      const response = await apiClient.post<OrderOperationResponse>(
        `${this.baseUrl}/${orderId}/products`,
        payload
      );

      console.log('✅ Product added to order:', response);

      // API success case: status 200 với data có thể là empty string
      // Nếu không có error và response tồn tại, coi như thành công
      return {
        successful: true,
        data: response,
      };
    } catch (error: any) {
      console.error("❌ Error adding product to order:", error);
      throw error;
    }
  }

  // ===== PRINTING FUNCTIONS =====
  /**
   * Lấy dữ liệu in tạm tính
   */
  async getPrintData(orderId: string): Promise<PrintOrderData> {
    try {
      console.log('🖨️ Getting print data for order:', orderId);
      
      const response = await apiClient.get<PrintOrderData>(
        `${this.baseUrl}/${orderId}/print`
      );

      console.log('✅ Print data loaded:', response);

      if (response && typeof response === 'object') {
        return response;
      }

      throw new Error("Lỗi khi tải dữ liệu in tạm tính");
    } catch (error: any) {
      console.error("❌ Error loading print data:", error);
      throw error;
    }
  }

  /**
   * In phiếu chế biến
   */
  async printKitchen(orderId: string, printGroupId?: string): Promise<KitchenPrintData> {
    try {
      console.log('🍳 Printing kitchen order:', orderId, printGroupId);
      
      const params = printGroupId ? `?printGroupId=${printGroupId}` : '';
      const response = await apiClient.post<KitchenPrintData>(
        `${this.baseUrl}/${orderId}/print/kitchen${params}`
      );

      console.log('✅ Kitchen print data:', response);

      if (response && typeof response === 'object') {
        return response;
      }

      throw new Error("Lỗi khi in phiếu chế biến");
    } catch (error: any) {
      console.error("❌ Error printing kitchen order:", error);
      throw error;
    }
  }

  /**
   * In hóa đơn thanh toán
   */
  async printReceipt(orderId: string): Promise<PrintOrderData> {
    try {
      console.log('🧾 Printing receipt for order:', orderId);
      
      const response = await apiClient.post<PrintOrderData>(
        `${this.baseUrl}/${orderId}/print/receipt`
      );

      console.log('✅ Receipt print data:', response);

      if (response && typeof response === 'object') {
        return response;
      }

      throw new Error("Lỗi khi in hóa đơn thanh toán");
    } catch (error: any) {
      console.error("❌ Error printing receipt:", error);
      throw error;
    }
  }

  // ===== HELPER METHODS =====
  /**
   * Lấy trạng thái đơn hàng dựa trên logic F&B
   */
  getOrderStatus(order: OrderListItem): string {
    // Logic dựa trên các field date của đơn hàng
    // Backend sẽ trả về order với các field date tương ứng
    
    if (order.date && order.date.includes("cancel")) {
      return "Đã hủy";
    }
    
    if (order.date && order.date.includes("receive")) {
      return "Đã thanh toán";
    }
    
    if (order.date && order.date.includes("send")) {
      return "Tạm tính";
    }
    
    if (order.date && order.date.includes("confirm")) {
      return "Đã xác nhận";
    }
    
    return "Đơn hàng mới";
  }

  /**
   * Format giá tiền theo định dạng Việt Nam
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price);
  }

  /**
   * Format ngày giờ theo định dạng Việt Nam
   */
  formatDateTime(dateString: string): {
    date: string;
    time: string;
    fullDateTime: string;
  } {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("vi-VN"),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      fullDateTime: date.toLocaleString("vi-VN"),
    };
  }

  /**
   * Kiểm tra xem đơn hàng có cho phép thêm sản phẩm không
   */
  canAddProductToOrder(orderDetail: OrderDetail): { canAdd: boolean; reason?: string } {
    // Kiểm tra cờ isAddProduct từ API
    if (!orderDetail.isAddProduct) {
      return { 
        canAdd: false, 
        reason: "Đơn hàng không cho phép thêm sản phẩm" 
      };
    }

    // ❌ Thanh toán (ReceiveDate != null) - LUÔN LUÔN cấm
    if (orderDetail.receiveDate) {
      return { 
        canAdd: false, 
        reason: "Không thể thêm sản phẩm vào đơn hàng đã thanh toán" 
      };
    }

    // ❌ Tạm tính (SendDate != null) - CHỈ khi TuDongXuatKhoBanHang = 1
    if (orderDetail.sendDate && orderDetail.tuDongXuatKhoBanHang !== 1) {
      return { 
        canAdd: false, 
        reason: "Không thể thêm sản phẩm vào đơn hàng đã tạm tính" 
      };
    }

    // ✅ Đơn hàng mới (CreateDate != null, ConfirmDate = null)
    if (orderDetail.createDate && !orderDetail.confirmDate) {
      return { canAdd: true };
    }

    // ✅ Đã xác nhận (ConfirmDate != null, SendDate = null)
    if (orderDetail.confirmDate && !orderDetail.sendDate) {
      return { canAdd: true };
    }

    // ✅ Tạm tính với tự động xuất kho
    if (orderDetail.sendDate && orderDetail.tuDongXuatKhoBanHang === 1) {
      return { canAdd: true };
    }

    return { 
      canAdd: false, 
      reason: "Trạng thái đơn hàng không hợp lệ" 
    };
  }
}

export const ordersService = new OrdersService();