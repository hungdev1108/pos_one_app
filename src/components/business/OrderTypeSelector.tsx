import { OrderType } from "@/src/api/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface OrderTypeSelectorProps {
  orderTypes: OrderType[];
  selectedOrderType?: OrderType | null;
  onSelect: (orderType: OrderType) => void;
  placeholder?: string;
}

export default function OrderTypeSelector({
  orderTypes,
  selectedOrderType,
  onSelect,
  placeholder = "Chọn loại đơn",
}: OrderTypeSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const getDisplayTitle = (orderType: OrderType): string => {
    // Tìm title với languageCode "vi" hoặc lấy title đầu tiên
    const viTitle = orderType.titles.find(t => t.languageCode === "vi");
    return viTitle?.title || orderType.titles[0]?.title || "Không xác định";
  };

  const handleSelect = (orderType: OrderType) => {
    onSelect(orderType);
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Selector Button */}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <Ionicons name="restaurant" size={16} color="#198754" />
          <Text style={styles.selectorText}>
            {selectedOrderType ? getDisplayTitle(selectedOrderType) : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>

      {/* Options Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn loại đơn hàng</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {orderTypes.map((orderType) => {
                const isSelected = selectedOrderType?.id === orderType.id;
                return (
                  <TouchableOpacity
                    key={orderType.id}
                    style={[
                      styles.optionItem,
                      isSelected && styles.selectedOptionItem,
                    ]}
                    onPress={() => handleSelect(orderType)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                      ]}
                    >
                      {getDisplayTitle(orderType)}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#198754" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectorButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  selectorText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 300,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  selectedOptionItem: {
    backgroundColor: "#f0f8f0",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
  },
  selectedOptionText: {
    color: "#198754",
    fontWeight: "600",
  },
}); 