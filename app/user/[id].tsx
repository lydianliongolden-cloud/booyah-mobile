import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useGetUser, useListPosts, useFollowUser, useLikePost } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [following, setFollowing] = useState(false);

  const { data: profileUser, isLoading: userLoading } = useGetUser(Number(id));
  const { data: posts, isLoading: postsLoading } = useListPosts({ userId: Number(id) });
  const { mutate: followUser } = useFollowUser();
  const { mutate: likePost } = useLikePost();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isOwnProfile = currentUser?.id === Number(id);

  const handleFollow = () => {
    if (!currentUser) { router.push("/auth" as never); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = !following;
    setFollowing(next);
    followUser(
      { id: Number(id), data: { followerId: currentUser.id } },
      { onError: () => setFollowing(!next) },
    );
  };

  const handleLike = (postId: number, _liked: boolean) => {
    if (!currentUser) return;
    likePost(
      { id: postId, data: { userId: currentUser.id } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/posts`] }) },
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {profileUser ? `@${profileUser.username}` : "Profile"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {userLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !profileUser ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>User not found</Text>
        </View>
      ) : (
        <FlatList
          data={posts ?? []}
          keyExtractor={(p) => String(p.id)}
          ListHeaderComponent={
            <View>
              {/* Profile hero */}
              <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Avatar uri={profileUser.avatarUrl} name={profileUser.displayName} size={72} />
                <Text style={[styles.displayName, { color: colors.foreground }]}>
                  {profileUser.displayName}
                </Text>
                <Text style={[styles.username, { color: colors.mutedForeground }]}>
                  @{profileUser.username}
                </Text>

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.foreground }]}>
                      {(profileUser as never as { followersCount?: number }).followersCount ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.foreground }]}>
                      {(profileUser as never as { followingCount?: number }).followingCount ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Following</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.foreground }]}>
                      {posts?.length ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
                  </View>
                </View>

                {/* Action button */}
                {!isOwnProfile && (
                  <Pressable
                    style={[
                      styles.followBtn,
                      {
                        backgroundColor: following ? "transparent" : colors.primary,
                        borderColor: following ? colors.border : colors.primary,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={handleFollow}
                  >
                    <Text style={[styles.followBtnText, { color: following ? colors.foreground : "#fff" }]}>
                      {following ? "Following" : "Follow"}
                    </Text>
                  </Pressable>
                )}
                {isOwnProfile && (
                  <Pressable
                    style={[styles.followBtn, { borderColor: colors.border, borderWidth: 1, backgroundColor: "transparent" }]}
                    onPress={() => router.push("/edit-profile" as never)}
                  >
                    <Text style={[styles.followBtnText, { color: colors.foreground }]}>Edit profile</Text>
                  </Pressable>
                )}
              </View>

              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Posts</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item as Parameters<typeof PostCard>[0]["post"]}
              onLike={handleLike}
            />
          )}
          ListEmptyComponent={
            postsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
            ) : (
              <View style={styles.empty}>
                <Ionicons name="create-outline" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No posts yet</Text>
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: 40 + botPad }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, flex: 1, textAlign: "center", marginHorizontal: 8 },
  profileCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 6,
    marginBottom: 0,
  },
  displayName: { fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 8 },
  username: { fontFamily: "Inter_400Regular", fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginTop: 16,
    marginBottom: 4,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statDivider: { width: 1, height: 32 },
  followBtn: {
    marginTop: 12,
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 140,
    alignItems: "center",
  },
  followBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  empty: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
