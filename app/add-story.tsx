import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
import { useCreateStory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const BG_COLORS = [
  { id: "gradient1", from: "#FFD700", to: "#16a34a", label: "Pink-Purple" },
  { id: "gradient2", from: "#f99e1f", to: "#FFD700", label: "Gold-Pink" },
  { id: "gradient3", from: "#06b6d4", to: "#3b82f6", label: "Cyan-Blue" },
  { id: "gradient4", from: "#22c55e", to: "#06b6d4", label: "Green-Cyan" },
  { id: "gradient5", from: "#a855f7", to: "#06b6d4", label: "Purple-Cyan" },
  { id: "gradient6", from: "#ef4444", to: "#f99e1f", label: "Red-Gold" },
  { id: "solid1", from: "#050f05", to: "#080f08", label: "Dark" },
  { id: "solid2", from: "#0a1f0a", to: "#0a1f0a", label: "Deep Purple" },
];

export default function AddStoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createStory = useCreateStory();

  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  const canPost = (text.trim().length > 0 || imageUri !== null) && !!user;

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!canPost || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await createStory.mutateAsync({
      data: {
        userId: user.id,
        text: text.trim() || undefined,
        imageUrl: imageUri ?? undefined,
        bgColor: selectedBg.from,
      },
    });
    queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create Story</Text>
        <Pressable
          style={[styles.postBtn, { backgroundColor: canPost ? colors.primary : colors.muted }]}
          onPress={handlePost}
          disabled={!canPost || createStory.isPending}
        >
          {createStory.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.postBtnText, { color: canPost ? "#fff" : colors.mutedForeground }]}>
              Share
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 24 }]}>
        {/* Preview card */}
        <View
          style={[
            styles.previewCard,
            { backgroundColor: selectedBg.from },
          ]}
        >
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <Pressable style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <Ionicons name="close-circle" size={26} color="#fff" />
              </Pressable>
            </>
          ) : (
            <View style={styles.previewEmpty}>
              <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.5)" />
              <Text style={styles.previewEmptyText}>Add a photo or write your story</Text>
            </View>
          )}
          {text.trim().length > 0 && (
            <View style={styles.textOverlay}>
              <Text style={styles.textOverlayText}>{text}</Text>
            </View>
          )}
        </View>

        {/* Text input */}
        <View style={[styles.textSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write something on your story…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.textInput, { color: colors.foreground }]}
            multiline
            maxLength={200}
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{200 - text.length}</Text>
        </View>

        {/* Media buttons */}
        <View style={styles.mediaRow}>
          <Pressable
            style={[styles.mediaBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={pickImage}
          >
            <Ionicons name="image-outline" size={22} color="#22c55e" />
            <Text style={[styles.mediaBtnText, { color: colors.foreground }]}>Gallery</Text>
          </Pressable>
          <Pressable
            style={[styles.mediaBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={takePhoto}
          >
            <Ionicons name="camera-outline" size={22} color="#FFD700" />
            <Text style={[styles.mediaBtnText, { color: colors.foreground }]}>Camera</Text>
          </Pressable>
        </View>

        {/* Background color picker */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Background</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bgScroll}>
          {BG_COLORS.map((bg) => (
            <Pressable
              key={bg.id}
              style={[
                styles.bgSwatch,
                { backgroundColor: bg.from },
                selectedBg.id === bg.id && styles.bgSwatchSelected,
              ]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedBg(bg); }}
            >
              {selectedBg.id === bg.id && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </Pressable>
          ))}
        </ScrollView>
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
  postBtn: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  postBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  scroll: { padding: 16, gap: 14 },

  previewCard: {
    height: 300,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  removeImageBtn: { position: "absolute", top: 10, right: 10 },
  previewEmpty: { alignItems: "center", gap: 10 },
  previewEmptyText: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  textOverlay: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  textOverlayText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },

  textSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  textInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    minHeight: 70,
    textAlignVertical: "top",
  },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "right" },

  mediaRow: { flexDirection: "row", gap: 10 },
  mediaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  mediaBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },

  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: -6,
  },
  bgScroll: { gap: 10, paddingVertical: 4 },
  bgSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  bgSwatchSelected: {
    borderWidth: 3,
    borderColor: "#fff",
  },
});
