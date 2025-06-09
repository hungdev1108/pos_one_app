import { OrderDetail, OrderDetailProduct, VoucherDetail, VoucherExtended } from "@/src/api";

/**
 * Hàm hỗ trợ lấy giá trị VAT của sản phẩm (xử lý cả VAT và vat)
 */
const getProductVatRate = (product: OrderDetailProduct): number => {
  // Ưu tiên field vat (viết thường) từ API
  if (typeof (product as any).vat === 'number') return (product as any).vat;
  // Fallback sang VAT (viết hoa)
  if (typeof product.VAT === 'number') return product.VAT;
  return 0;
};

/**
 * Tính TIỀN HÀNG (TotalAmount)
 * TIỀN HÀNG = Tổng TotalCost của tất cả sản phẩm
 * TotalCost = Price * Quantity (giá TRƯỚC thuế)
 */
export const calculateTotalAmount = (products: OrderDetailProduct[]): number => {
  return products.reduce((total, product) => {
    return total + product.totalCost; // hoặc (product.price * product.quantity)
  }, 0);
};

/**
 * Tính GetVAT cho một mức thuế cụ thể
 */
export const calculateGetVAT = (
  orderDetail: OrderDetail, 
  products: OrderDetailProduct[], 
  vatRate: number
): number => {
  const { PriceIncludeVAT, Discount, DiscountVAT } = orderDetail;
  
  if (vatRate <= 0) return 0;
  
  const productsWithVAT = products.filter(product => getProductVatRate(product) === vatRate);
  console.log(`🔍 GetVAT(${vatRate}): Found ${productsWithVAT.length} products with VAT ${vatRate}%`);
  
  if (productsWithVAT.length === 0) return 0;
  
  if (PriceIncludeVAT) {
    // Nếu giá đã bao gồm VAT
    const discountIncludeVAT = (DiscountVAT === vatRate) ? Discount : 0;
    const discount = discountIncludeVAT === 0 ? 0 : discountIncludeVAT / (1 + vatRate / 100);
    const discountVAT = discountIncludeVAT - discount;
    
    const productVAT = productsWithVAT.reduce((sum, product) => {
      const vatAmount = (product.priceIncludeVAT - product.price) * product.quantity;
      console.log(`  Product ${product.productName}: (${product.priceIncludeVAT} - ${product.price}) * ${product.quantity} = ${vatAmount}`);
      return sum + vatAmount;
    }, 0);
    
    console.log(`  PriceIncludeVAT=true: productVAT=${productVAT}, discountVAT=${discountVAT}`);
    return productVAT - discountVAT;
  } else {
    // Nếu giá chưa bao gồm VAT
    const totalCostForVAT = productsWithVAT.reduce((sum, product) => {
      console.log(`  Product ${product.productName}: totalCost=${product.totalCost}, VAT=${product.VAT}%`);
      return sum + product.totalCost;
    }, 0);
    
    const discountForVAT = (DiscountVAT === vatRate) ? Discount : 0;
    const vatAmount = (totalCostForVAT - discountForVAT) * vatRate / 100;
    
    console.log(`  PriceIncludeVAT=false: totalCost=${totalCostForVAT}, discount=${discountForVAT}, VAT=${vatAmount}`);
    return vatAmount;
  }
};

/**
 * Tính GetFullVAT() - tổng VAT của tất cả các mức thuế
 * GetFullVAT() = GetVAT(0) + GetVAT(5) + GetVAT(8) + GetVAT(10)
 */
export const calculateGetFullVAT = (
  orderDetail: OrderDetail, 
  products: OrderDetailProduct[]
): number => {
  return calculateGetVAT(orderDetail, products, 0) +
         calculateGetVAT(orderDetail, products, 5) +
         calculateGetVAT(orderDetail, products, 8) +
         calculateGetVAT(orderDetail, products, 10);
};

/**
 * Tính TIỀN THUẾ (TotalTaxAmount)
 */
export const calculateTotalTax = (
  orderDetail: OrderDetail, 
  products: OrderDetailProduct[], 
  voucher: VoucherExtended | null = null
): number => {
  // Kiểm tra loại thuế
  if (orderDetail.LoaiThue === "0") { // 0VAT
    console.log("Trả về 0 vì LoaiThue = 0");
    return 0;
  }
  
  // Kiểm tra xem các sản phẩm có VAT không
  if (!products.some(p => getProductVatRate(p) > 0)) {
    console.log("Trả về 0 vì không có sản phẩm nào có VAT > 0");
    // Log thông tin VAT của từng sản phẩm
    products.forEach((p, index) => {
      console.log(`Product ${index}: VAT=${p.VAT}, vat=${(p as any).vat}`);
    });
    return 0;
  }
  
  // Tính GetFullVAT() - AmountTax của voucher
  const fullVAT = calculateGetFullVAT(orderDetail, products);
  console.log("fullVAT:", fullVAT);
  
  const voucherAmountTax = voucher?.Details?.reduce((sum: number, detail: VoucherDetail) => {
    return sum + (detail.DiscountAfterVAT - detail.DiscountBefortVAT);
  }, 0) || 0;
  console.log("voucherAmountTax:", voucherAmountTax);
  
  return fullVAT - voucherAmountTax;
};

/**
 * Tính tổng giảm giá trực tiếp
 */
export const calculateTotalDiscount = (
  orderDetail: OrderDetail, 
  products: OrderDetailProduct[]
): number => {
  const { DiscountType, Discount, DiscountVAT, PriceIncludeVAT } = orderDetail;
  
  if (DiscountType <= 0) return 0;
  
  // Lọc sản phẩm theo VAT được áp dụng giảm giá
  const targetProducts = products.filter(product => getProductVatRate(product) === DiscountVAT);
  
  if (PriceIncludeVAT) {
    const totalForDiscount = targetProducts.reduce((sum, product) => {
      return sum + product.totalCostInclideVAT;
    }, 0);
    
    switch (DiscountType) {
      case 1: // Giảm theo phần trăm
        return totalForDiscount * Discount / 100;
      case 2: // Giảm số tiền cố định
        return Discount;
      case 3: // Giảm đến mức giá
        return totalForDiscount - Discount;
      default:
        return 0;
    }
  } else {
    const totalForDiscount = targetProducts.reduce((sum, product) => {
      return sum + product.totalCost;
    }, 0);
    
    switch (DiscountType) {
      case 1: // Giảm theo phần trăm
        return totalForDiscount * Discount / 100;
      case 2: // Giảm số tiền cố định
        return Discount;
      case 3: // Giảm đến mức giá
        return totalForDiscount - Discount;
      default:
        return 0;
    }
  }
};

/**
 * Tính PHẢI THU (TotalPayableAmount)
 * Phải thu = TotalAmountAfterVAT - Discount - TotalVoucherAmountAfterVAT
 */
export const calculateTotalPayable = (
  orderDetail: OrderDetail, 
  products: OrderDetailProduct[], 
  voucher: VoucherExtended | null = null
): number => {
  // Bước 1: TotalAmountAfterVAT
  const totalAmountAfterVAT = products.reduce((total, product) => {
    return total + product.totalCostInclideVAT; // hoặc (product.priceIncludeVAT * product.quantity)
  }, 0);
  
  // Bước 2: Tính giảm giá trực tiếp (Discount)
  const discount = calculateTotalDiscount(orderDetail, products);
  
  // Bước 3: Tính voucher giảm giá (TotalVoucherAmountAfterVAT)
  const totalVoucherAmountAfterVAT = voucher?.Details?.reduce((sum: number, detail: VoucherDetail) => {
    return sum + detail.DiscountAfterVAT;
  }, 0) || 0;
  
  return totalAmountAfterVAT - discount - totalVoucherAmountAfterVAT;
};

/**
 * Tính toán tổng hợp tất cả các giá trị cho đơn hàng
 */
export const calculateOrderSummary = (
  orderDetail: OrderDetail,
  products: OrderDetailProduct[]
) => {
  // 1. Tính toán
  const tienHang = calculateTotalAmount(products);
  const tienThue = calculateTotalTax(orderDetail, products, orderDetail.Voucher);
  const phaiThu = calculateTotalPayable(orderDetail, products, orderDetail.Voucher);
  
  return {
    tienHang,
    tienThue,
    phaiThu
  };
};

/**
 * Format giá tiền theo định dạng Việt Nam
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN").format(price);
}; 