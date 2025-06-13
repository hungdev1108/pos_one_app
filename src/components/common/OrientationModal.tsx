import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface OrientationModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const OrientationModal: React.FC<OrientationModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { width, height } = Dimensions.get("window");
  const isSmallScreen = Math.max(width, height) < 720;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            isSmallScreen && styles.modalContainerSmall,
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="phone-portrait-outline" size={64} color="#ff6b6b" />
            <View style={styles.rotateIcon}>
              <Ionicons name="reload-outline" size={24} color="#ff6b6b" />
            </View>
          </View>

          <Text style={styles.title}>Xoay ngang thiết bị</Text>

          <Text style={styles.message}>
            Vui lòng xoay ngang thiết bị để tiếp tục sử dụng ứng dụng một cách
            tối ưu nhất.
          </Text>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissButtonText}>Đã hiểu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalContainerSmall: {
    maxWidth: 320,
    padding: 20,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 20,
  },
  rotateIcon: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  dismissButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  dismissButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default OrientationModal;
