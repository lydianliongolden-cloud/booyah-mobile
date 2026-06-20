import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { Avatar } from "@/components/Avatar";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSave = async () => {
    if (!displayName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.back();
    }, 1000);
  };

  if (!user) {
    router.replace("/auth" as never);
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Profile</Text>
        <Pressable onPress={handleSave} disabled={saving || saved}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveBtn, { color: saved ? colors.success : colors.primary }]}>
              {saved ? "Saved!" : "Save"}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <Avatar uri={user.avatarUrl} name={user.displayName} size={80} />
          <Pressable style={[styles.changePhotoBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
            <Ionicons name="camera-outline" size={16} color={colors.primary} />
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change photo</Text>
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Display name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              maxLength={50}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Username</Text>
            <View style={[styles.input, styles.disabledInput, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.disabledText, { color: colors.mutedForeground }]}>@{user.username}</Text>
            </View>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>Username cannot be changed</Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the world about yourself…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, styles.bioInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              multiline
              maxLength={160}
            />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>{bio.length}/160</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  saveBtn: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  scroll: { padding: 20, gap: 0 },
  avatarSection: { alignItems: "center", gap: 12, marginBottom: 32 },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changePhotoText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  form: { gap: 20 },
  field: { gap: 6 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  bioInput: { minHeight: 90, textAlignVertical: "top" },
  disabledInput: { justifyContent: "center" },
  disabledText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
