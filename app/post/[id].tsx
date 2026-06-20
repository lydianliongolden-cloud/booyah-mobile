import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useGetPost, useListComments, useCreateComment } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [replyText, setReplyText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const { data: post, isLoading: postLoading } = useGetPost(Number(id));
  const { data: comments, isLoading: commentsLoading } = useListComments(Number(id));
  const { mutate: createComment, isPending } = useCreateComment();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleReply = () => {
    if (!replyText.trim() || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    createComment(
      { id: Number(id), data: { userId: user.id, content: replyText.trim() } },
      {
        onSuccess: () => {
          setReplyText("");
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}/comments`] });
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      {postLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={comments ?? []}
          keyExtractor={(c) => String(c.id)}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            post ? (
              <View>
                <PostCard post={post as Parameters<typeof PostCard>[0]["post"]} />
                <View style={[styles.commentsHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.commentsTitle, { color: colors.foreground }]}>
                    Replies {comments ? `(${comments.length})` : ""}
                  </Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[styles.comment, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => {
                const authorId = (item as never as { author?: { id?: number } }).author?.id;
                if (authorId) router.push(`/user/${authorId}` as never);
              }}>
                <Avatar
                  uri={(item as never as { author?: { avatarUrl?: string } }).author?.avatarUrl}
                  name={(item as never as { author?: { displayName?: string } }).author?.displayName}
                  size={36}
                />
              </Pressable>
              <View style={styles.commentBody}>
                <Pressable onPress={() => {
                  const authorId = (item as never as { author?: { id?: number } }).author?.id;
                  if (authorId) router.push(`/user/${authorId}` as never);
                }}>
                  <Text style={[styles.commentAuthor, { color: colors.foreground }]}>
                    {(item as never as { author?: { displayName?: string } }).author?.displayName ?? "User"}
                  </Text>
                </Pressable>
                <Text style={[styles.commentContent, { color: colors.foreground }]}>{item.content}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            commentsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
            ) : (
              <View style={styles.empty}>
                <Ionicons name="chatbubble-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No replies yet — be first!</Text>
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      {/* Reply bar */}
      <View style={[styles.replyBar, { borderTopColor: colors.border, paddingBottom: botPad + 8, backgroundColor: colors.background }]}>
        {user ? (
          <>
            <Avatar uri={user.avatarUrl} name={user.displayName} size={32} />
            <TextInput
              ref={inputRef}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Reply..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.replyInput, { backgroundColor: colors.muted, color: colors.foreground }]}
              multiline
              maxLength={500}
            />
            <Pressable
              style={[styles.sendBtn, { backgroundColor: replyText.trim() ? colors.primary : colors.muted, opacity: isPending ? 0.6 : 1 }]}
              onPress={handleReply}
              disabled={!replyText.trim() || isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={16} color={replyText.trim() ? "#fff" : colors.mutedForeground} />
              )}
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.signInPrompt, { backgroundColor: colors.muted }]}
            onPress={() => router.push("/auth" as never)}
          >
            <Text style={[styles.signInText, { color: colors.mutedForeground }]}>Sign in to reply</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
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
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  comment: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentBody: { flex: 1, gap: 4 },
  commentAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  commentContent: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  empty: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  signInPrompt: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  signInText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
