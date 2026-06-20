import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = mode === "login" ? `${baseUrl}/api/auth/login` : `${baseUrl}/api/auth/signup`;
      const body: Record<string, string> = { username: username.trim(), password };
      if (mode === "signup") body.displayName = displayName.trim() || username.trim();

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { token?: string; user?: { id: number; username: string; displayName: string; avatarUrl?: string }; error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? data.message ?? "Something went wrong");
        return;
      }
      if (data.token && data.user) {
        await login(data.token, data.user);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, minHeight: "100%" }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require("@/assets/images/booyah-logo.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={[styles.logoSub, { color: colors.mutedForeground }]}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
          <Pressable
            style={[styles.tab, mode === "login" && { backgroundColor: colors.primary }]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.tabText, { color: mode === "login" ? "#fff" : colors.mutedForeground }]}>
              Sign in
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mode === "signup" && { backgroundColor: colors.primary }]}
            onPress={() => setMode("signup")}
          >
            <Text style={[styles.tabText, { color: mode === "signup" ? "#fff" : colors.mutedForeground }]}>
              Sign up
            </Text>
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === "signup" && (
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
          )}
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            secureTextEntry
          />

          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "22" }]}>
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{mode === "login" ? "Sign in" : "Create account"}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 60 },
  backBtn: { marginBottom: 24, width: 40 },
  logoWrap: { alignItems: "center", gap: 8, marginBottom: 32 },
  logoImg: { width: 180, height: 54 },
  logoSub: { fontFamily: "Inter_400Regular", fontSize: 14 },
  tabs: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  tab: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  form: { gap: 12 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  errorBox: { borderRadius: 8, padding: 12 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  submitBtn: { borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
