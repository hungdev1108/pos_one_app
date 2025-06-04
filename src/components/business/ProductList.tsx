import { Product } from "@/api";
import { API_CONFIG } from "@/api/constants";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ProductListProps {
  products: Product[];
  loading?: boolean;
  onProductSelect?: (product: Product) => void;
  onAddToOrder?: (product: Product) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns với margin

export default function ProductList({
  products,
  loading = false,
  onProductSelect,
  onAddToOrder,
}: ProductListProps) {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getImageSource = (product: Product) => {
    // Priority 1: Use BASE_URL + fullPath if available
    if (product.image?.fullPath) {
      const imageUrl = `${API_CONFIG.BASE_URL}/${product.image.fullPath}`;
      console.log("📷 Using image URL:", imageUrl);
      return { uri: imageUrl };
    }

    // Priority 2: Use BASE_URL + filePath + fileName
    if (product.image?.filePath && product.image?.fileName) {
      const imageUrl = `${API_CONFIG.BASE_URL}/${product.image.filePath}/${product.image.fileName}`;
      console.log("📷 Using constructed image URL:", imageUrl);
      return { uri: imageUrl };
    }

    // Priority 3: Base64 data if available
    if (product.image?.base64data) {
      return {
        uri: `data:${product.image.contentType || "image/jpeg"};base64,${
          product.image.base64data
        }`,
      };
    } else if (product.image?.fileContent) {
      // Legacy structure with fileContent
      return {
        uri: `data:${product.image.contentType || "image/jpeg"};base64,${
          product.image.fileContent
        }`,
      };
    }

    // No image available
    console.log("📷 No image available for product:", product.title);
    return null;
  };

  const renderProduct = (item: Product, index: number) => {
    const imageSource = getImageSource(item);
    const currentPrice = item.priceAfterDiscount || item.price;
    const hasDiscount = item.discount > 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.productCard}
        onPress={() => onProductSelect?.(item)}
        disabled={loading}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image source={imageSource} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="restaurant" size={32} color="#dee2e6" />
            </View>
          )}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{item.discount}%</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.priceContainer}>
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                {formatPrice(item.price)}
              </Text>
            )}
            <Text style={styles.currentPrice}>{formatPrice(currentPrice)}</Text>
          </View>
        </View>

        {/* Add to Order Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            onAddToOrder?.(item);
          }}
          disabled={loading}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#198754" />
        <Text style={styles.loadingText}>Đang tải món ăn...</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={48} color="#dee2e6" />
        <Text style={styles.emptyText}>Không có món ăn nào</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.productsGrid}>{products.map(renderProduct)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  imageContainer: {
    position: "relative",
    height: 120,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#dc3545",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#198754",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#198754",
    borderRadius: 12,
    padding: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
