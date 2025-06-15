import { OrderType } from "@/src/api/types";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface OrderTypeButtonsProps {
  orderTypes: OrderType[];
  selectedOrderType?: OrderType | null;
  onSelect: (orderType: OrderType) => void;
}

export default function OrderTypeButtons({
  orderTypes,
  selectedOrderType,
  onSelect,
}: OrderTypeButtonsProps) {
  const getDisplayTitle = (orderType: OrderType): string => {
    // Tìm title với languageCode "vi" hoặc lấy title đầu tiên
    const viTitle = orderType.titles.find(t => t.languageCode === "vi");
    return viTitle?.title || orderType.titles[0]?.title || "Không xác định";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Loại đơn hàng</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.buttonsContainer}
      >
        {orderTypes.map((orderType) => {
          const isSelected = selectedOrderType?.id === orderType.id;
          return (
            <TouchableOpacity
              key={orderType.id}
              style={[
                styles.button,
                isSelected && styles.selectedButton,
              ]}
              onPress={() => onSelect(orderType)}
            >
              <Text
                style={[
                  styles.buttonText,
                  isSelected && styles.selectedButtonText,
                ]}
              >
                {getDisplayTitle(orderType)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 2,
  },
  button: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: "#20c997",
    borderColor: "#20c997",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  selectedButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
}); 