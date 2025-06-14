import { authService, LoginRequest } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface LoginForm {
  userName: string;
  password: string;
  isPeristant: boolean;
}

interface FormErrors {
  userName?: string;
  password?: string;
}

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState<LoginForm>({
    userName: "",
    password: "",
    isPeristant: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.userName.trim()) {
      newErrors.userName = "Vui lòng nhập tài khoản";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.userName, formData.password]);

  const onSubmit = useCallback(async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const loginData: LoginRequest = {
        userName: formData.userName,
        password: formData.password,
        isPeristant: formData.isPeristant,
      };

      const response = await authService.login(loginData);

      if (response.successful) {
        // Đăng nhập thành công
        router.replace("/main");
      } else {
        // Đăng nhập thất bại
        Alert.alert(
          "Đăng nhập thất bại",
          response.error || "Tài khoản hoặc mật khẩu không đúng.",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Lỗi", error.message || "Đã xảy ra lỗi. Vui lòng thử lại.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm]);

  const onReset = useCallback(() => {
    setFormData({
      userName: "",
      password: "",
      isPeristant: false,
    });
    setErrors({});
    Keyboard.dismiss();
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const updateUserName = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, userName: text }));
    if (errors.userName) {
      setErrors(prev => ({ ...prev, userName: undefined }));
    }
  }, [errors.userName]);

  const updatePassword = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, password: text }));
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  }, [errors.password]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                  <Image
                    source={require("../assets/images/One-Green-no-backg.png")}
                    style={styles.logo}
                    contentFit="contain"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </View>
                <Text style={styles.subtitle}>Phần mềm quản lý kinh doanh</Text>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                {/* Username Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Tên đăng nhập</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.userName && styles.inputError,
                    ]}
                    onChangeText={updateUserName}
                    value={formData.userName}
                    placeholder="ví dụ: kimhang"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                    editable={!isLoading}
                  />
                  {errors.userName && (
                    <Text style={styles.errorText}>
                      {errors.userName}
                    </Text>
                  )}
                </View>

                {/* Password Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Mật khẩu</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      ref={passwordRef}
                      style={[
                        styles.input,
                        styles.passwordInput,
                        errors.password && styles.inputError,
                      ]}
                      onChangeText={updatePassword}
                      value={formData.password}
                      placeholder=""
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={onSubmit}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={toggleShowPassword}
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password}
                    </Text>
                  )}
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.resetButton,
                      isLoading && styles.buttonDisabled,
                    ]}
                    onPress={onReset}
                    disabled={isLoading}
                  >
                    <Text style={styles.resetButtonText}>Nhập lại</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      isLoading && styles.loginButtonDisabled,
                    ]}
                    onPress={onSubmit}
                    disabled={isLoading}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.companyName}>KAS Technology</Text>
                <Text style={styles.contactInfo}>
                  Hotline 19002137 - Youtube - Facebook - Tiktok - Website
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 200,
    height: 120,
    objectFit: "contain",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    minHeight: "100%",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 60,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
  },
  inputError: {
    borderColor: "#f44336",
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  loginButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#198754",
    alignItems: "center",
  },
  loginButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 18,
    color: "#5470ff",
    fontWeight: "600",
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
});
