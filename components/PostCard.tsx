import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, Share, StyleSheet, Text, View, Dimensions } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Avatar } from "./Avatar";

const SCREEN_W = Dimensions.get("window").width;

interface PostUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface Post {
  id: number;
  userId?: number;
  content: string;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  likesCount: number;
  commentsCount: number;
  repostsCount?: number;
  isLiked?: boolean;
  likedByCurrentUser?: boolean;
  createdAt: string;
  /* API returns either 'user' or 'author' depending on caller */
  user?: PostUser | null;
  author?: PostUser | null;
}

interface PostCardProps {
  post: Post;
  onLike?: (postId: number, liked: boolean) => void;
}

function resolveImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("file://")) return url;
  // In native (no window), build absolute URL from EXPO_PUBLIC_DOMAIN
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.EXPO_PUBLIC_DOMAIN
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
        : "";
  // Storage paths like /objects/uploads/... are served under /api/storage/objects/...
  if (url.startsWith("/objects/")) {
    return `${base}/api/storage${url}`;
  }
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function PostImages({ imageUrl, imageUrls }: { imageUrl?: string | null; imageUrls?: string[] | null }) {
  const images: string[] = [];
  if (imageUrls && imageUrls.length > 0) {
    images.push(...imageUrls);
  } else if (imageUrl) {
    images.push(imageUrl);
  }
  if (images.length === 0) return null;

  // Full card width — SCREEN_W minus the 16px horizontal card padding on each side
  const cardW = SCREEN_W - 32;

  if (images.length === 1) {
    return (
      <View style={postImgStyles.singleWrap}>
        <Image
          source={{ uri: resolveImageUrl(images[0]) }}
          style={{ width: cardW, height: cardW * 0.75, borderRadius: 12, backgroundColor: "#1a1a2e" }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // 2-column grid for multiple images
  const half = (cardW - 3) / 2;
  return (
    <View style={[postImgStyles.singleWrap, postImgStyles.grid]}>
      {images.slice(0, 4).map((uri, i) => (
        <Image
          key={i}
          source={{ uri: resolveImageUrl(uri) }}
          style={{ width: half, height: half, borderRadius: 8, backgroundColor: "#1a1a2e" }}
          resizeMode="cover"
        />
      ))}
    </View>
  );
}

const postImgStyles = StyleSheet.create({
  singleWrap: { marginTop: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
});

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function PostCard({ post, onLike }: PostCardProps) {
  const colors = useColors();
  /* Support both 'user' (API shape) and 'author' (legacy shape) */
  const author = post.user ?? post.author ?? null;
  const authorId = author?.id ?? post.userId;

  const initialLiked = post.likedByCurrentUser ?? post.isLiked ?? false;
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(post.likesCount);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    onLike?.(post.id, next);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${author?.displayName ?? "!Booyah!"}: ${post.content}`,
        title: "Check this out on !Booyah!",
      });
    } catch {
      // cancelled
    }
  };

  const handleAuthorPress = () => {
    if (authorId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/user/${authorId}` as never);
    }
  };

  const displayName = author?.displayName ?? author?.username ?? "Unknown";
  const username = author?.username ?? "unknown";

  return (
    <Pressable
      style={[styles.card, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/post/${post.id}` as never)}
    >
      {/* Avatar + name + text */}
      <View style={styles.row}>
        <Pressable onPress={handleAuthorPress}>
          <Avatar uri={author?.avatarUrl} name={displayName} size={42} />
        </Pressable>
        <View style={styles.body}>
          <Pressable onPress={handleAuthorPress}>
            <Text style={[styles.displayName, { color: colors.foreground }]}>{displayName}</Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              @{username} · {timeAgo(post.createdAt)}
            </Text>
          </Pressable>
          {post.content ? (
            <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>
          ) : null}
        </View>
      </View>

      {/* Images — full card width, outside the indented body */}
      <PostImages imageUrl={post.imageUrl} imageUrls={post.imageUrls} />

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable onPress={handleLike} style={styles.action}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={18}
            color={liked ? colors.primary : colors.mutedForeground}
          />
          <Text style={[styles.actionText, { color: liked ? colors.primary : colors.mutedForeground }]}>
            {likeCount}
          </Text>
        </Pressable>
        <Pressable
          style={styles.action}
          onPress={(e) => { e.stopPropagation?.(); router.push(`/post/${post.id}` as never); }}
        >
          <Ionicons name="chatbubble-outline" size={17} color={colors.mutedForeground} />
          <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{post.commentsCount}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={handleShare}>
          <Ionicons name="arrow-redo-outline" size={18} color={colors.mutedForeground} />
          {(post.repostsCount ?? 0) > 0 && (
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{post.repostsCount}</Text>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", gap: 12 },
  body: { flex: 1, gap: 4 },
  displayName: { fontFamily: "Inter_700Bold", fontSize: 14 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  content: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, marginTop: 2 },
  actions: { flexDirection: "row", gap: 20, marginTop: 10 },
  action: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
