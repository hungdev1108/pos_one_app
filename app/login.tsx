import { authService, LoginRequest } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
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

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      userName: "",
      password: "",
      isPeristant: false,
    },
  });

  const rememberMe = watch("isPeristant");

  const onSubmit = async (data: LoginForm) => {
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      const loginData: LoginRequest = {
        userName: data.userName,
        password: data.password,
        isPeristant: data.isPeristant,
      };

      const response = await authService.login(loginData);

      if (response.successful) {
        // Đăng nhập thành công
        Alert.alert("Thành công", "Đăng nhập thành công!", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ]);
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
  };

  const onReset = () => {
    reset({
      userName: "",
      password: "",
      isPeristant: false,
    });
    Keyboard.dismiss();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const toggleRememberMe = () => {
    setValue("isPeristant", !rememberMe);
  };

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
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                {/* <View style={styles.titleContainer}>
                  <Text style={styles.posText}>POS</Text>
                  <Text style={styles.oneText}> ONE</Text>
                </View> */}
                {/* Logo */}
                <View style={styles.logoContainer}>
                  <Image
                    source={require("../assets/images/POS-ONE-LOGO.png")}
                    style={styles.logo}
                  />
                </View>
                <Text style={styles.subtitle}>Phần mềm quản lý kinh doanh</Text>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                {/* Username Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Tên đăng nhập</Text>
                  <Controller
                    control={control}
                    rules={{
                      required: "Vui lòng nhập tài khoản",
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.userName && styles.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="ví dụ: kimhang"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        blurOnSubmit={false}
                        editable={!isLoading}
                      />
                    )}
                    name="userName"
                  />
                  {errors.userName && (
                    <Text style={styles.errorText}>
                      {errors.userName.message}
                    </Text>
                  )}
                </View>

                {/* Password Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Mật khẩu</Text>
                  <Controller
                    control={control}
                    rules={{
                      required: "Vui lòng nhập mật khẩu",
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        ref={passwordRef}
                        style={[
                          styles.input,
                          errors.password && styles.inputError,
                        ]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder=""
                        placeholderTextColor="#999"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(onSubmit)}
                        editable={!isLoading}
                      />
                    )}
                    name="password"
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                </View>

                {/* Remember Me Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={toggleRememberMe}
                  disabled={isLoading}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Ghi nhớ đăng nhập</Text>
                </TouchableOpacity>

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
                    onPress={handleSubmit(onSubmit)}
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
    height: 100,
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
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  posText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#4CAF50",
    letterSpacing: 2,
  },
  oneText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2196F3",
    letterSpacing: 2,
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
  inputError: {
    borderColor: "#f44336",
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 3,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#333",
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
    backgroundColor: "#4CAF50",
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
    fontWeight: "bold",
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
});
