import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";
import { useColors } from "@/hooks/useColors";
import { useListPosts, useLikePost, useListStories } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import type { StoryGroup } from "@workspace/api-client-react";

/* ─── Crypto chart lines overlay ──────────────────────── */
function CryptoLines({ width, height }: { width: number; height: number }) {
  const w = width;
  const h = height;

  // Primary line — smooth BTC-style movement, stays in upper half
  const line1Points = [
    [0, h * 0.72],
    [w * 0.06, h * 0.65],
    [w * 0.12, h * 0.70],
    [w * 0.18, h * 0.55],
    [w * 0.25, h * 0.60],
    [w * 0.31, h * 0.45],
    [w * 0.37, h * 0.50],
    [w * 0.43, h * 0.38],
    [w * 0.50, h * 0.42],
    [w * 0.56, h * 0.35],
    [w * 0.62, h * 0.40],
    [w * 0.68, h * 0.30],
    [w * 0.74, h * 0.36],
    [w * 0.80, h * 0.28],
    [w * 0.87, h * 0.32],
    [w * 0.93, h * 0.25],
    [w, h * 0.30],
  ];

  // Secondary line — quieter, lower on canvas
  const line2Points = [
    [0, h * 0.90],
    [w * 0.08, h * 0.85],
    [w * 0.16, h * 0.88],
    [w * 0.24, h * 0.78],
    [w * 0.32, h * 0.82],
    [w * 0.40, h * 0.74],
    [w * 0.48, h * 0.78],
    [w * 0.56, h * 0.70],
    [w * 0.64, h * 0.74],
    [w * 0.72, h * 0.66],
    [w * 0.80, h * 0.70],
    [w * 0.88, h * 0.62],
    [w, h * 0.65],
  ];

  const toSmoothPath = (pts: number[][]): string => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const cx = (pts[i][0] + pts[i + 1][0]) / 2;
      const cy = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ` Q ${pts[i][0]} ${pts[i][1]} ${cx} ${cy}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last[0]} ${last[1]}`;
    return d;
  };

  const fillPath1 = toSmoothPath(line1Points) + ` L ${w} ${h} L 0 ${h} Z`;

  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgGradient id="fill1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a855f7" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </SvgGradient>
      </Defs>
      {/* Fill under primary line */}
      <Path d={fillPath1} fill="url(#fill1)" />
      {/* Primary chart line */}
      <Path d={toSmoothPath(line1Points)} stroke="#c084fc" strokeWidth={1.5} fill="none" strokeOpacity={0.45} />
      {/* Secondary quieter line */}
      <Path d={toSmoothPath(line2Points)} stroke="#7c3aed" strokeWidth={1} fill="none" strokeOpacity={0.3} />
    </Svg>
  );
}

/* ─── Story bubble ─────────────────────────────────────── */
function StoryBubble({
  group,
  colors,
}: {
  group: StoryGroup;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable style={styles.storyItem} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
      <View
        style={[
          styles.storyRing,
          { borderColor: group.hasUnviewed ? colors.primary : colors.border },
        ]}
      >
        <Avatar uri={group.user.avatarUrl} name={group.user.displayName} size={58} />
      </View>
      <Text style={[styles.storyName, { color: colors.foreground }]} numberOfLines={1}>
        {group.user.displayName?.split(" ")[0] ?? group.user.username}
      </Text>
    </Pressable>
  );
}

function CreateStoryBubble({ colors, user }: { colors: ReturnType<typeof useColors>; user: { avatarUrl?: string | null; displayName: string } | null }) {
  return (
    <Pressable
      style={styles.storyItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/add-story" as never);
      }}
    >
      <View style={[styles.storyRingCreate, { borderColor: colors.border }]}>
        <Avatar uri={user?.avatarUrl} name={user?.displayName} size={58} />
        <View style={[styles.createBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={14} color="#fff" />
        </View>
      </View>
      <Text style={[styles.storyName, { color: colors.foreground }]}>Add story</Text>
    </Pressable>
  );
}

/* ─── Compose bar + quick actions ─────────────────────── */
const COMPOSE_ACTIONS: { icon: string; color: string; gif?: boolean }[] = [
  { icon: "image-outline",       color: "#FFD700" },
  { icon: "videocam-outline",    color: "#FFD700" },
  { icon: "logo-youtube",        color: "#FFD700" },
  { icon: "gif",                 color: "#FFD700", gif: true },
  { icon: "sparkles-outline",    color: "#FFD700" },
  { icon: "camera-outline",      color: "#FFD700" },
  { icon: "link-outline",        color: "#FFD700" },
  { icon: "pricetag-outline",    color: "#FFD700" },
];

function ComposeBar({ colors, user }: { colors: ReturnType<typeof useColors>; user: { avatarUrl?: string | null; displayName: string } | null }) {
  return (
    <View style={[styles.composeSectionWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top row: avatar + prompt */}
      <Pressable
        style={styles.composeBar}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/compose" as never);
        }}
      >
        <Avatar uri={user?.avatarUrl} name={user?.displayName ?? "?"} size={38} />
        <Text style={[styles.composePlaceholder, { color: colors.mutedForeground }]}>
          What's happening in the market?
        </Text>
      </Pressable>

      {/* Divider */}
      <View style={[styles.composeDivider, { backgroundColor: colors.border }]} />

      {/* Icon row + Post button */}
      <View style={styles.quickActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.quickIconsScroll}>
          {COMPOSE_ACTIONS.map((action, i) => (
            <Pressable
              key={i}
              style={styles.quickIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/compose" as never);
              }}
            >
              {action.gif ? (
                <View style={styles.gifBadge}>
                  <Text style={styles.gifBadgeText}>GIF</Text>
                </View>
              ) : (
                <Ionicons name={action.icon as never} size={22} color={action.color} />
              )}
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          style={[styles.postBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/compose" as never);
          }}
        >
          <Text style={styles.postBtnText}>Post</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Stories row ──────────────────────────────────────── */
function StoriesRow({ colors, user }: { colors: ReturnType<typeof useColors>; user: ReturnType<typeof useAuth>["user"] }) {
  const { data: storyGroups } = useListStories({ viewerUserId: user?.id });

  return (
    <View style={[styles.storiesSection, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesScroll}
      >
        <CreateStoryBubble colors={colors} user={user} />
        {(storyGroups ?? []).map((group) => (
          <StoryBubble key={group.user.id} group={group} colors={colors} />
        ))}
        {/* Placeholder stories when empty */}
        {(!storyGroups || storyGroups.length === 0) &&
          PLACEHOLDER_STORIES.map((s) => (
            <View key={s.id} style={styles.storyItem}>
              <View style={[styles.storyRing, { borderColor: colors.primary }]}>
                <View style={[styles.placeholderAvatar, { backgroundColor: s.color }]}>
                  <Text style={styles.placeholderInitial}>{s.initial}</Text>
                </View>
              </View>
              <Text style={[styles.storyName, { color: colors.foreground }]}>{s.name}</Text>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const PLACEHOLDER_STORIES = [
  { id: 1, name: "sol_maxi", initial: "S", color: "#16a34a" },
  { id: 2, name: "moon99", initial: "M", color: "#0891b2" },
  { id: 3, name: "degen", initial: "D", color: "#b45309" },
  { id: 4, name: "whale", initial: "W", color: "#047857" },
];

/* ─── Main screen ──────────────────────────────────────── */
export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [headerSize, setHeaderSize] = useState({ width: 0, height: 0 });

  const { data: posts, isLoading, refetch } = useListPosts(
    { viewerUserId: user?.id, limit: 50 },
  );

  const likeMutation = useLikePost();

  const handleLike = useCallback(
    (postId: number, _liked: boolean) => {
      if (!user) return;
      likeMutation.mutate({ id: postId, data: { userId: user.id } });
    },
    [user, likeMutation],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with 3D gradient */}
      <LinearGradient
        colors={["#051505", "#0a2a0a", "#080f08"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPad + 10 }]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setHeaderSize({ width, height });
        }}
      >
        {headerSize.width > 0 && (
          <CryptoLines width={headerSize.width} height={headerSize.height} />
        )}
        <View style={styles.logoWrap}>
          <Image
            source={require("@/assets/images/booyah-logo-3d.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.headerIconBtn, { backgroundColor: "rgba(255,255,255,0.1)" }]}
            onPress={() => router.push("/notifications" as never)}
          >
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable
            style={[styles.headerIconBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/compose" as never);
            }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PostCard post={item as Parameters<typeof PostCard>[0]["post"]} onLike={handleLike} />
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={{ paddingBottom: 84 + botPad }}
          ListHeaderComponent={
            <View>
              <StoriesRow colors={colors} user={user} />
              <ComposeBar colors={colors} user={user} />
              <View style={[styles.divider, { backgroundColor: colors.muted }]} />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="newspaper-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No posts yet — be first!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 72, height: 72 },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Stories */
  storiesSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  storiesScroll: {
    paddingHorizontal: 12,
    gap: 4,
    flexDirection: "row",
  },
  storyItem: {
    alignItems: "center",
    width: 72,
    gap: 5,
  },
  storyRing: {
    borderRadius: 34,
    borderWidth: 2.5,
    padding: 2,
  },
  storyRingCreate: {
    borderRadius: 34,
    borderWidth: 2,
    padding: 2,
    position: "relative",
  },
  createBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#050f05",
  },
  storyName: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
  },
  placeholderAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderInitial: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#fff",
  },

  /* Compose bar */
  composeSectionWrapper: {
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  composeBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  composePlaceholder: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  composeDivider: { height: StyleSheet.hairlineWidth },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  quickIconsScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  quickIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  gifBadge: {
    borderWidth: 1.5,
    borderColor: "#FFD700",
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  gifBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#FFD700",
    letterSpacing: 0.5,
  },

  divider: { height: 6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
