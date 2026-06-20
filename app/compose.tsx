import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useCreatePost, useListTokens } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

/* ─── Upload image to object storage ───────────────────── */
async function uploadImageUri(uri: string): Promise<string> {
  const token = await AsyncStorage.getItem("booyah_token");
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch the local file as a blob
  const resp = await fetch(uri);
  const blob = await resp.blob();
  const contentType = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";

  const uploadResp = await fetch("/api/storage/uploads", {
    method: "POST",
    headers: { "Content-Type": contentType, ...authHeaders },
    body: blob,
  });

  if (!uploadResp.ok) {
    const err = await uploadResp.text().catch(() => "");
    throw new Error(`Image upload failed: ${err}`);
  }

  const { objectPath } = await uploadResp.json() as { objectPath: string };
  return objectPath; // e.g. "/uploads/abc123"
}

/* ─── Types ────────────────────────────────────────────── */
type MediaAttachment = { id: string; type: "image" | "video" | "gif"; uri: string };
type PanelType = "feeling" | "gif" | "youtube" | "link" | "token" | "ai" | "live" | null;

/* ─── Constants ────────────────────────────────────────── */
const FEELINGS = [
  { emoji: "😊", label: "Happy" }, { emoji: "🚀", label: "Bullish" },
  { emoji: "🐻", label: "Bearish" }, { emoji: "💎", label: "Diamond hands" },
  { emoji: "🤑", label: "Rich" }, { emoji: "😱", label: "Shocked" },
  { emoji: "🔥", label: "LFG" }, { emoji: "😴", label: "Bored" },
  { emoji: "🧠", label: "Galaxy brain" }, { emoji: "💀", label: "Rekt" },
  { emoji: "🥳", label: "Celebrating" }, { emoji: "🤔", label: "Thinking" },
  { emoji: "😤", label: "Frustrated" }, { emoji: "🌙", label: "To the moon" },
  { emoji: "🐋", label: "Whale alert" }, { emoji: "⚡", label: "NGMI" },
];

const TOOLBAR_ACTIONS = [
  { id: "photo", icon: "image-outline", label: "Photo", color: "#22c55e" },
  { id: "video", icon: "videocam-outline", label: "Video", color: "#FFD700" },
  { id: "gif", icon: "film-outline", label: "GIF", color: "#8b5cf6" },
  { id: "live", icon: "radio-outline", label: "Live", color: "#ef4444" },
  { id: "feeling", icon: "happy-outline", label: "Feeling", color: "#f99e1f" },
  { id: "token", icon: "pricetag-outline", label: "Token", color: "#06b6d4" },
  { id: "youtube", icon: "logo-youtube", label: "YouTube", color: "#ef4444" },
  { id: "link", icon: "link-outline", label: "Link", color: "#94a3b8" },
  { id: "ai", icon: "sparkles-outline", label: "AI Image", color: "#a855f7" },
] as const;

const GIPHY_KEY = "dc6zaTOxFJmzC";

const FALLBACK_GIFS = [
  { id: "1", title: "Bitcoin Moon", url: "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif" },
  { id: "2", title: "To the moon", url: "https://media.giphy.com/media/26tPplGWjN0xLybiU/giphy.gif" },
  { id: "3", title: "Money Rain", url: "https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif" },
  { id: "4", title: "LFG", url: "https://media.giphy.com/media/l4FGI9GoSkyNx2Odi/giphy.gif" },
  { id: "5", title: "Crypto", url: "https://media.giphy.com/media/xT0GqFjNOHZBo2GBCI/giphy.gif" },
  { id: "6", title: "Doge", url: "https://media.giphy.com/media/ujUdrdpX7Ok5W/giphy.gif" },
];

/* ─── Helper ────────────────────────────────────────────── */
function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return m ? m[1] : null;
}

/* ─── Panel: Feeling ───────────────────────────────────── */
function FeelingPanel({
  visible, onClose, onSelect, colors,
}: { visible: boolean; onClose: () => void; onSelect: (f: { emoji: string; label: string }) => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.panelHandle} />
        <Text style={[styles.panelTitle, { color: colors.foreground }]}>How are you feeling?</Text>
        <FlatList
          data={FEELINGS}
          numColumns={4}
          keyExtractor={(i) => i.label}
          contentContainerStyle={styles.feelingGrid}
          renderItem={({ item }) => (
            <Pressable style={styles.feelingItem} onPress={() => { onSelect(item); onClose(); }}>
              <Text style={styles.feelingEmoji}>{item.emoji}</Text>
              <Text style={[styles.feelingLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

/* ─── Panel: GIF ───────────────────────────────────────── */
function GifPanel({
  visible, onClose, onSelect, colors,
}: { visible: boolean; onClose: () => void; onSelect: (url: string) => void; colors: ReturnType<typeof useColors> }) {
  const [query, setQuery] = useState("bitcoin");
  const [gifs, setGifs] = useState(FALLBACK_GIFS);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=12&rating=g`,
      );
      const json = await res.json();
      if (json.data?.length > 0) {
        setGifs(
          json.data.map((g: { id: string; title: string; images: { fixed_height: { url: string } } }) => ({
            id: g.id, title: g.title, url: g.images.fixed_height.url,
          })),
        );
      } else {
        setGifs(FALLBACK_GIFS);
      }
    } catch {
      setGifs(FALLBACK_GIFS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.panel, styles.panelTall, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.panelHandle} />
        <Text style={[styles.panelTitle, { color: colors.foreground }]}>Search GIFs</Text>
        <View style={[styles.searchRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => search(query)}
            placeholder="Search Giphy…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
          />
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={gifs}
            numColumns={2}
            keyExtractor={(g) => g.id}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 16, paddingBottom: 16 }}
            columnWrapperStyle={{ gap: 6 }}
            renderItem={({ item }) => (
              <Pressable style={styles.gifItem} onPress={() => { onSelect(item.url); onClose(); }}>
                <Image source={{ uri: item.url }} style={styles.gifImage} />
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

/* ─── Panel: YouTube ───────────────────────────────────── */
function YoutubePanel({
  visible, onClose, onAttach, colors,
}: { visible: boolean; onClose: () => void; onAttach: (url: string) => void; colors: ReturnType<typeof useColors> }) {
  const [url, setUrl] = useState("");
  const ytId = getYoutubeId(url);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.panelHandle} />
        <Text style={[styles.panelTitle, { color: colors.foreground }]}>Embed YouTube Video</Text>
        <View style={[styles.searchRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="logo-youtube" size={18} color="#ef4444" />
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="Paste YouTube link…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
        {ytId && (
          <View style={[styles.ytPreview, { borderColor: colors.border }]}>
            <Image
              source={{ uri: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` }}
              style={styles.ytThumb}
              resizeMode="cover"
            />
            <View style={[styles.ytPlayOverlay, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
              <Ionicons name="play-circle" size={40} color="#fff" />
            </View>
            <Text style={[styles.ytLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
              youtu.be/{ytId}
            </Text>
          </View>
        )}
        <Pressable
          style={[styles.panelBtn, { backgroundColor: ytId ? "#ef4444" : colors.muted }]}
          onPress={() => { if (ytId) { onAttach(url); onClose(); setUrl(""); } }}
          disabled={!ytId}
        >
          <Text style={[styles.panelBtnText, { color: ytId ? "#fff" : colors.mutedForeground }]}>
            {ytId ? "Embed Video" : "Enter a valid YouTube URL"}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

/* ─── Panel: Link ──────────────────────────────────────── */
function LinkPanel({
  visible, onClose, onAttach, colors,
}: { visible: boolean; onClose: () => void; onAttach: (url: string) => void; colors: ReturnType<typeof useColors> }) {
  const [url, setUrl] = useState("");
  const valid = url.startsWith("http://") || url.startsWith("https://");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.panelHandle} />
        <Text style={[styles.panelTitle, { color: colors.foreground }]}>Attach a Link</Text>
        <View style={[styles.searchRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="link-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
        <Pressable
          style={[styles.panelBtn, { backgroundColor: valid ? colors.primary : colors.muted }]}
          onPress={() => { if (valid) { onAttach(url); onClose(); setUrl(""); } }}
          disabled={!valid}
        >
          <Text style={[styles.panelBtnText, { color: valid ? "#fff" : colors.mutedForeground }]}>
            Attach Link
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

/* ─── Panel: Token ─────────────────────────────────────── */
function TokenPanel({
  visible, onClose, onSelect, colors,
}: { visible: boolean; onClose: () => void; onSelect: (symbol: string) => void; colors: ReturnType<typeof useColors> }) {
  const [q, setQ] = useState("");
  const { data: tokens } = useListTokens();
  const filtered = (tokens ?? []).filter(
    (t) =>
      t.symbol.toLowerCase().includes(q.toLowerCase()) ||
      t.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.panel, styles.panelTall, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.panelHandle} />
        <Text style={[styles.panelTitle, { color: colors.foreground }]}>Mention a Token</Text>
        <View style={[styles.searchRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search tokens…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
        <FlatList
          data={filtered.slice(0, 30)}
          keyExtractor={(t) => t.symbol}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.tokenRow, { borderBottomColor: colors.border }]}
              onPress={() => { onSelect(item.symbol); onClose(); }}
            >
              <View style={[styles.tokenIcon, { backgroundColor: colors.muted }]}>
                <Text style={styles.tokenIconText}>{item.symbol.slice(0, 2)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tokenSymbol, { color: colors.foreground }]}>{item.symbol}</Text>
                <Text style={[styles.tokenName, { color: colors.mutedForeground }]}>{item.name}</Text>
              </View>
              <Text style={[styles.tokenPrice, { color: item.priceChange24h >= 0 ? "#22c55e" : "#ef4444" }]}>
                {item.priceChange24h >= 0 ? "+" : ""}{item.priceChange24h?.toFixed(2)}%
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No tokens found</Text>
          }
        />
      </View>
    </Modal>
  );
}

/* ─── Panel: AI Image ──────────────────────────────────── */
function AiImagePanel({
  visible, onClose, onGenerate, colors,
}: { visible: boolean; onClose: () => void; onGenerate: (prompt: string) => void; colors: ReturnType<typeof useColors> }) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    setGenerating(false);
    onGenerate(prompt.trim());
    onClose();
    setPrompt("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.panelHandle} />
        <View style={styles.aiHeader}>
          <Ionicons name="sparkles" size={22} color="#a855f7" />
          <Text style={[styles.panelTitle, { color: colors.foreground, marginBottom: 0 }]}>
            AI Image Generator
          </Text>
        </View>
        <Text style={[styles.aiSubtitle, { color: colors.mutedForeground }]}>
          Describe the image you want to create
        </Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="e.g. A golden Bitcoin rocket shooting through space…"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.aiPromptInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
          multiline
          maxLength={400}
        />
        <View style={styles.aiSuggestions}>
          {["Bitcoin rocket", "Crypto bull market", "Diamond hands", "DeFi city"].map((s) => (
            <Pressable
              key={s}
              style={[styles.aiChip, { backgroundColor: "#a855f7" + "22", borderColor: "#a855f7" + "44" }]}
              onPress={() => setPrompt(s)}
            >
              <Text style={[styles.aiChipText, { color: "#a855f7" }]}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={[styles.panelBtn, { backgroundColor: prompt.trim() ? "#a855f7" : colors.muted }]}
          onPress={handleGenerate}
          disabled={!prompt.trim() || generating}
        >
          {generating ? (
            <View style={styles.generatingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.panelBtnText, { color: "#fff" }]}>Generating…</Text>
            </View>
          ) : (
            <Text style={[styles.panelBtnText, { color: prompt.trim() ? "#fff" : colors.mutedForeground }]}>
              ✨ Generate Image
            </Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

/* ─── Panel: Live ──────────────────────────────────────── */
function LivePanel({
  visible, onClose, colors,
}: { visible: boolean; onClose: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.panelHandle} />
        <View style={styles.liveCenter}>
          <View style={[styles.livePulse, { backgroundColor: "#ef4444" + "22", borderColor: "#ef4444" + "44" }]}>
            <Ionicons name="radio-outline" size={36} color="#ef4444" />
          </View>
          <Text style={[styles.liveTitle, { color: colors.foreground }]}>Go Live</Text>
          <Text style={[styles.liveSubtitle, { color: colors.mutedForeground }]}>
            Live streaming is coming soon to !Booyah!{"\n"}
            Be the first to broadcast your alpha to the community.
          </Text>
          <Pressable
            style={[styles.panelBtn, { backgroundColor: colors.muted, marginTop: 8 }]}
            onPress={onClose}
          >
            <Text style={[styles.panelBtnText, { color: colors.mutedForeground }]}>Notify me when available</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Main Compose Screen ──────────────────────────────── */
export default function ComposeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);
  const createPost = useCreatePost();

  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaAttachment[]>([]);
  const [feeling, setFeeling] = useState<{ emoji: string; label: string } | null>(null);
  const [tokenMention, setTokenMention] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  const hasContent = content.trim().length > 0 || media.length > 0 || linkUrl || youtubeUrl || aiPrompt;

  const openPanel = (p: PanelType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePanel(p);
  };

  const pickPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const newMedia: MediaAttachment[] = result.assets.map((a) => ({
        id: a.uri, type: "image", uri: a.uri,
      }));
      setMedia((prev) => [...prev, ...newMedia].slice(0, 4));
    }
  };

  const recordVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to record video.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "videos",
      videoMaxDuration: 60,
      quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });
    if (!result.canceled && result.assets[0]) {
      setMedia((prev) => [
        ...prev,
        { id: result.assets[0].uri, type: "video" as const, uri: result.assets[0].uri },
      ].slice(0, 4));
    }
  };

  const handleToolbar = (id: string) => {
    if (id === "photo") pickPhoto();
    else if (id === "video") recordVideo();
    else openPanel(id as PanelType);
  };

  const removeMedia = (id: string) => setMedia((prev) => prev.filter((m) => m.id !== id));

  const handlePost = async () => {
    if (!hasContent || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const feelingText = feeling ? ` — feeling ${feeling.emoji} ${feeling.label}` : "";
    const aiNote = aiPrompt ? `\n\n[🤖 AI Image: "${aiPrompt}"]` : "";
    const fullContent = content.trim() + feelingText + aiNote;

    // Upload any local images to storage first
    let uploadedUrls: string[] | undefined;
    const imageMedia = media.filter((m) => m.type === "image" || m.type === "gif");
    if (imageMedia.length > 0) {
      try {
        uploadedUrls = await Promise.all(imageMedia.map((m) => uploadImageUri(m.uri)));
      } catch (err) {
        Alert.alert("Upload failed", "Could not upload image. Please try again.");
        return;
      }
    }

    await createPost.mutateAsync({
      data: {
        userId: user.id,
        content: fullContent,
        imageUrls: uploadedUrls && uploadedUrls.length > 0 ? uploadedUrls : undefined,
        imageUrl: uploadedUrls?.[0] ?? undefined,
        tokenMention: tokenMention ?? undefined,
        linkUrl: linkUrl ?? youtubeUrl ?? undefined,
      },
    });
    queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    router.back();
  };

  const ytId = youtubeUrl ? getYoutubeId(youtubeUrl) : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.audiencePill}>
          <Ionicons name="globe-outline" size={14} color={colors.primary} />
          <Text style={[styles.audienceText, { color: colors.primary }]}>Everyone</Text>
          <Ionicons name="chevron-down" size={12} color={colors.primary} />
        </View>
        <Pressable
          style={[styles.postBtn, { backgroundColor: hasContent ? colors.primary : colors.muted }]}
          onPress={handlePost}
          disabled={!hasContent || createPost.isPending}
        >
          {createPost.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.postBtnText, { color: hasContent ? "#fff" : colors.mutedForeground }]}>
              Post
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* Compose body */}
        <View style={styles.body}>
          <Avatar uri={user?.avatarUrl} name={user?.displayName} size={44} />
          <View style={styles.inputWrap}>
            <View style={styles.nameRow}>
              <Text style={[styles.username, { color: colors.foreground }]}>{user?.displayName ?? "You"}</Text>
              {feeling && (
                <View style={[styles.feelingBadge, { backgroundColor: "#f99e1f22", borderColor: "#f99e1f44" }]}>
                  <Text style={styles.feelingBadgeText}>
                    {feeling.emoji} {feeling.label}
                  </Text>
                </View>
              )}
              {tokenMention && (
                <View style={[styles.tokenBadge, { backgroundColor: "#06b6d422", borderColor: "#06b6d444" }]}>
                  <Ionicons name="pricetag-outline" size={11} color="#06b6d4" />
                  <Text style={[styles.tokenBadgeText, { color: "#06b6d4" }]}>${tokenMention}</Text>
                  <Pressable onPress={() => setTokenMention(null)}>
                    <Ionicons name="close-circle" size={13} color="#06b6d4" />
                  </Pressable>
                </View>
              )}
            </View>

            <TextInput
              ref={inputRef}
              value={content}
              onChangeText={setContent}
              placeholder="What's happening in the crypto world?"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              multiline
              autoFocus
              maxLength={500}
            />

            {/* Media grid */}
            {media.length > 0 && (
              <View style={styles.mediaGrid}>
                {media.map((m) => (
                  <View key={m.id} style={styles.mediaThumbWrap}>
                    <Image source={{ uri: m.uri }} style={styles.mediaThumb} />
                    {m.type === "video" && (
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play" size={16} color="#fff" />
                      </View>
                    )}
                    <Pressable
                      style={[styles.removeMedia, { backgroundColor: colors.background }]}
                      onPress={() => removeMedia(m.id)}
                    >
                      <Ionicons name="close" size={12} color={colors.foreground} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* GIF attachment */}
            {media.some((m) => m.type === "gif") && (
              <View style={styles.gifPreviewWrap}>
                <Image source={{ uri: media.find((m) => m.type === "gif")!.uri }} style={styles.gifPreview} />
                <Pressable
                  style={[styles.removeMedia, { backgroundColor: colors.background, top: 6, right: 6 }]}
                  onPress={() => setMedia((p) => p.filter((m) => m.type !== "gif"))}
                >
                  <Ionicons name="close" size={12} color={colors.foreground} />
                </Pressable>
              </View>
            )}

            {/* YouTube preview */}
            {ytId && (
              <View style={[styles.ytCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Image
                  source={{ uri: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` }}
                  style={styles.ytCardThumb}
                  resizeMode="cover"
                />
                <View style={styles.ytPlayBadge}>
                  <Ionicons name="play-circle" size={32} color="#fff" />
                </View>
                <View style={styles.ytCardInfo}>
                  <Text style={[styles.ytCardLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                    youtube.com/watch?v={ytId}
                  </Text>
                </View>
                <Pressable onPress={() => setYoutubeUrl(null)} style={styles.ytRemove}>
                  <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            )}

            {/* Link preview */}
            {linkUrl && (
              <View style={[styles.linkCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Ionicons name="link-outline" size={16} color={colors.primary} />
                <Text style={[styles.linkCardUrl, { color: colors.primary }]} numberOfLines={1}>
                  {linkUrl}
                </Text>
                <Pressable onPress={() => setLinkUrl(null)}>
                  <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            )}

            {/* AI image placeholder */}
            {aiPrompt && (
              <View style={[styles.aiCard, { borderColor: "#a855f744", backgroundColor: "#a855f711" }]}>
                <Ionicons name="sparkles" size={18} color="#a855f7" />
                <Text style={[styles.aiCardText, { color: "#a855f7" }]} numberOfLines={2}>
                  AI: "{aiPrompt}"
                </Text>
                <Pressable onPress={() => setAiPrompt(null)}>
                  <Ionicons name="close-circle" size={16} color="#a855f7" />
                </Pressable>
              </View>
            )}

            <Text style={[styles.charCount, { color: content.length > 450 ? colors.destructive : colors.mutedForeground }]}>
              {500 - content.length}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Toolbar */}
      <View style={[styles.toolbar, { borderTopColor: colors.border, paddingBottom: botPad + 8, backgroundColor: colors.background }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarScroll}>
          {TOOLBAR_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={styles.toolbarBtn}
              onPress={() => handleToolbar(action.id)}
            >
              <View style={[styles.toolbarIconWrap, { backgroundColor: action.color + "22" }]}>
                <Ionicons name={action.icon as never} size={20} color={action.color} />
              </View>
              <Text style={[styles.toolbarLabel, { color: colors.mutedForeground }]}>{action.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Feature Panels */}
      <FeelingPanel
        visible={activePanel === "feeling"}
        onClose={() => setActivePanel(null)}
        onSelect={setFeeling}
        colors={colors}
      />
      <GifPanel
        visible={activePanel === "gif"}
        onClose={() => setActivePanel(null)}
        onSelect={(url) => setMedia((p) => [...p.filter((m) => m.type !== "gif"), { id: url, type: "gif" as const, uri: url }])}
        colors={colors}
      />
      <YoutubePanel
        visible={activePanel === "youtube"}
        onClose={() => setActivePanel(null)}
        onAttach={setYoutubeUrl}
        colors={colors}
      />
      <LinkPanel
        visible={activePanel === "link"}
        onClose={() => setActivePanel(null)}
        onAttach={setLinkUrl}
        colors={colors}
      />
      <TokenPanel
        visible={activePanel === "token"}
        onClose={() => setActivePanel(null)}
        onSelect={setTokenMention}
        colors={colors}
      />
      <AiImagePanel
        visible={activePanel === "ai"}
        onClose={() => setActivePanel(null)}
        onGenerate={setAiPrompt}
        colors={colors}
      />
      <LivePanel
        visible={activePanel === "live"}
        onClose={() => setActivePanel(null)}
        colors={colors}
      />
    </KeyboardAvoidingView>
  );
}

/* ─── Styles ────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  closeBtn: { padding: 2 },
  audiencePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#FFD70044",
    alignSelf: "center",
    maxWidth: 140,
  },
  audienceText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  postBtn: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  postBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },

  /* Body */
  body: { flexDirection: "row", padding: 16, gap: 12 },
  inputWrap: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  username: { fontFamily: "Inter_700Bold", fontSize: 14 },
  input: {
    fontFamily: "Inter_400Regular", fontSize: 17, lineHeight: 25,
    minHeight: 100, textAlignVertical: "top",
  },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "right" },

  /* Feeling badge */
  feelingBadge: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3,
  },
  feelingBadgeText: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#f99e1f" },

  /* Token badge */
  tokenBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3,
  },
  tokenBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },

  /* Media grid */
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  mediaThumbWrap: { width: "47%", aspectRatio: 1, borderRadius: 10, overflow: "hidden" },
  mediaThumb: { width: "100%", height: "100%" },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  removeMedia: {
    position: "absolute", top: 4, right: 4, width: 20, height: 20,
    borderRadius: 10, alignItems: "center", justifyContent: "center",
  },

  /* GIF */
  gifPreviewWrap: { borderRadius: 12, overflow: "hidden", marginTop: 8, height: 160 },
  gifPreview: { width: "100%", height: "100%" },

  /* YouTube card */
  ytCard: {
    borderRadius: 12, borderWidth: 1, overflow: "hidden", marginTop: 8, flexDirection: "row", alignItems: "center",
  },
  ytCardThumb: { width: 80, height: 60 },
  ytPlayBadge: {
    ...StyleSheet.absoluteFillObject, width: 80, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  ytCardInfo: { flex: 1, paddingHorizontal: 10 },
  ytCardLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  ytRemove: { paddingRight: 10 },

  /* Link card */
  linkCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 8,
  },
  linkCardUrl: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13 },

  /* AI card */
  aiCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 8,
  },
  aiCardText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13 },

  /* Toolbar */
  toolbar: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  toolbarScroll: { paddingHorizontal: 12, gap: 4 },
  toolbarBtn: { alignItems: "center", gap: 4, width: 60 },
  toolbarIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  toolbarLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },

  /* Panel shared */
  overlay: { flex: 1 },
  panel: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 32, minHeight: 300,
  },
  panelTall: { minHeight: 480 },
  panelHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: "#444",
    alignSelf: "center", marginTop: 10, marginBottom: 6,
  },
  panelTitle: {
    fontFamily: "Inter_700Bold", fontSize: 17,
    paddingHorizontal: 20, paddingVertical: 10, marginBottom: 4,
  },
  panelBtn: {
    marginHorizontal: 20, marginTop: 14, borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  panelBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },

  /* Search row */
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 12, borderRadius: 12,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },

  /* Feeling panel */
  feelingGrid: { paddingHorizontal: 16, gap: 6 },
  feelingItem: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 4 },
  feelingEmoji: { fontSize: 28 },
  feelingLabel: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },

  /* GIF panel */
  gifItem: { flex: 1, height: 120, borderRadius: 10, overflow: "hidden" },
  gifImage: { width: "100%", height: "100%" },

  /* YouTube panel */
  ytPreview: {
    marginHorizontal: 16, borderRadius: 12, borderWidth: 1,
    overflow: "hidden", marginBottom: 4, height: 140,
  },
  ytThumb: { width: "100%", height: "100%" },
  ytPlayOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center",
  },
  ytLabel: { position: "absolute", bottom: 8, left: 10, fontFamily: "Inter_400Regular", fontSize: 11 },

  /* Token panel */
  tokenRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tokenIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  tokenIconText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  tokenSymbol: { fontFamily: "Inter_700Bold", fontSize: 14 },
  tokenName: { fontFamily: "Inter_400Regular", fontSize: 12 },
  tokenPrice: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 24 },

  /* AI panel */
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingTop: 10 },
  aiSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, paddingHorizontal: 20, marginBottom: 12 },
  aiPromptInput: {
    marginHorizontal: 16, borderRadius: 12, borderWidth: 1,
    padding: 14, fontFamily: "Inter_400Regular", fontSize: 15,
    minHeight: 80, textAlignVertical: "top",
  },
  aiSuggestions: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    paddingHorizontal: 16, marginTop: 10,
  },
  aiChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  aiChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  generatingRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  /* Live panel */
  liveCenter: { alignItems: "center", padding: 24, gap: 12 },
  livePulse: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  liveTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  liveSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
});
