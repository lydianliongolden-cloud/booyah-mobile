import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

interface MockNotification {
  id: number;
  type: "like" | "reply" | "follow" | "repost";
  actor: string;
  text: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: 1, type: "like", actor: "sol_maxi", text: "liked your post", time: "2m", read: false },
  { id: 2, type: "follow", actor: "booyah_trader", text: "started following you", time: "15m", read: false },
  { id: 3, type: "reply", actor: "crypto_degen", text: "replied to your post", time: "1h", read: true },
  { id: 4, type: "repost", actor: "moonboy99", text: "reposted your post", time: "3h", read: true },
  { id: 5, type: "like", actor: "whale_alert", text: "liked your post", time: "5h", read: true },
];

const ICONS: Record<string, { name: string; color: string }> = {
  like: { name: "heart", color: "#FFD700" },
  follow: { name: "person-add", color: "#3b82f6" },
  reply: { name: "chatbubble", color: "#22c55e" },
  repost: { name: "arrow-redo", color: "#f99e1f" },
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <Ionicons name="notifications-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to see notifications</Text>
        <Pressable
          style={[styles.signInBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/auth" as never)}
        >
          <Text style={styles.signInBtnText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + botPad }}>
        {MOCK_NOTIFICATIONS.map((n) => {
          const icon = ICONS[n.type] ?? ICONS.like;
          return (
            <Pressable
              key={n.id}
              style={[
                styles.row,
                { borderBottomColor: colors.border, backgroundColor: n.read ? "transparent" : colors.primary + "08" },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: icon.color + "22" }]}>
                <Ionicons name={icon.name as never} size={18} color={icon.color} />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowText, { color: colors.foreground }]}>
                  <Text style={styles.actorName}>@{n.actor}</Text>
                  {" "}{n.text}
                </Text>
                <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>{n.time} ago</Text>
              </View>
              {!n.read && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 3 },
  rowText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  actorName: { fontFamily: "Inter_600SemiBold" },
  rowTime: { fontFamily: "Inter_400Regular", fontSize: 12 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, marginTop: 12 },
  signInBtn: { borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  signInBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});
