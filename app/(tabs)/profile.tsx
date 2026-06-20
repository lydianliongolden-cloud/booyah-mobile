import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

interface MenuRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuRow({ icon, label, onPress, destructive }: MenuRowProps) {
  const colors = useColors();
  return (
    <Pressable
      style={[styles.menuRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <Ionicons name={icon as never} size={20} color={destructive ? colors.destructive : colors.foreground} />
      <Text style={[styles.menuLabel, { color: destructive ? colors.destructive : colors.foreground }]}>
        {label}
      </Text>
      {!destructive && (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Image
          source={require("@/assets/images/booyah-logo.png")}
          style={styles.logoImg}
          resizeMode="contain"
        />
        <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>Join !Booyah!</Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
          Trade, post, and earn on Solana
        </Text>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/auth" as never)}
        >
          <Text style={styles.primaryBtnText}>Get started</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/auth" as never)}>
          <Text style={[styles.secondaryLink, { color: colors.mutedForeground }]}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 84 + botPad }}
    >
      {/* Profile card */}
      <View style={[styles.profileCard, { paddingTop: topPad + 20, backgroundColor: colors.card, borderColor: colors.border }]}>
        <Avatar uri={user.avatarUrl} name={user.displayName} size={72} />
        <Text style={[styles.displayName, { color: colors.foreground }]}>{user.displayName}</Text>
        <Text style={[styles.username, { color: colors.mutedForeground }]}>@{user.username}</Text>
      </View>

      {/* Menu */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <MenuRow
          icon="person-outline"
          label="Edit profile"
          onPress={() => router.push("/edit-profile" as never)}
        />
        <MenuRow
          icon="notifications-outline"
          label="Notifications"
          onPress={() => router.push("/notifications" as never)}
        />
        <MenuRow
          icon="wallet-outline"
          label="Connected wallets"
          onPress={() => router.push("/swap" as never)}
        />
        <MenuRow
          icon="shield-outline"
          label="Security"
          onPress={() => {}}
        />
      </View>

      <View style={[styles.section, { borderColor: colors.border, marginTop: 16 }]}>
        <MenuRow
          icon="help-circle-outline"
          label="Help & support"
          onPress={() => {}}
        />
        <MenuRow
          icon="information-circle-outline"
          label="About !Booyah!"
          onPress={() => {}}
        />
      </View>

      <View style={[styles.section, { borderColor: colors.border, marginTop: 16 }]}>
        <MenuRow
          icon="log-out-outline"
          label="Sign out"
          destructive
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  logoImg: { width: 180, height: 54, marginBottom: 8 },
  welcomeTitle: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5 },
  welcomeSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  primaryBtn: { borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14, marginTop: 8, width: 240, alignItems: "center" },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  secondaryLink: { fontFamily: "Inter_400Regular", fontSize: 14, paddingVertical: 8 },
  profileCard: {
    alignItems: "center",
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 6,
    marginBottom: 16,
  },
  displayName: { fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 8 },
  username: { fontFamily: "Inter_400Regular", fontSize: 14 },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLabel: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
