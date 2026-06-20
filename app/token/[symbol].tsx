import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetToken } from "@workspace/api-client-react";

function fmtPrice(n: number): string {
  if (!n) return "$0.00";
  if (n < 0.00001) return `$${n.toExponential(2)}`;
  if (n < 0.001) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtBig(n: number | null | undefined): string {
  if (!n) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

interface StatRowProps { label: string; value: string; colors: ReturnType<typeof useColors> }

function StatRow({ label, value, colors }: StatRowProps) {
  return (
    <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function TokenDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: token, isLoading } = useGetToken(symbol ?? "");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const change = token?.priceChange24h ?? 0;
  const isUp = change >= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Image
          source={require("@/assets/images/booyah-logo.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : token ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 + botPad }}>
          {/* Token hero */}
          <View style={styles.hero}>
            <View style={[styles.logoWrap, { backgroundColor: colors.muted }]}>
              {token.logoUrl ? (
                <ExpoImage source={{ uri: token.logoUrl }} style={styles.logo} contentFit="contain" />
              ) : (
                <Text style={[styles.logoFallback, { color: colors.primary }]}>{token.symbol[0]}</Text>
              )}
            </View>
            <View style={styles.heroText}>
              <Text style={[styles.tokenName, { color: colors.foreground }]}>{token.name}</Text>
              <Text style={[styles.tokenSymbol, { color: colors.mutedForeground }]}>{token.symbol}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={[styles.price, { color: colors.foreground }]}>{fmtPrice(token.price)}</Text>
            <View style={[styles.changeBadge, { backgroundColor: (isUp ? colors.success : colors.destructive) + "22" }]}>
              <Ionicons
                name={isUp ? "trending-up" : "trending-down"}
                size={16}
                color={isUp ? colors.success : colors.destructive}
              />
              <Text style={[styles.changeText, { color: isUp ? colors.success : colors.destructive }]}>
                {isUp ? "+" : ""}{change.toFixed(2)}%
              </Text>
            </View>
          </View>

          {(token as any).description && (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {(token as any).description}
            </Text>
          )}

          {/* Stats */}
          <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <StatRow label="Market Cap" value={fmtBig(token.marketCap)} colors={colors} />
            <StatRow label="24h Volume" value={fmtBig(token.volume24h)} colors={colors} />
            <StatRow label="Liquidity" value={fmtBig((token as never as { liquidity?: number }).liquidity)} colors={colors} />
            <StatRow label="Chain" value={token.chain ?? "—"} colors={colors} />
            {(token as never as { txns24h?: number }).txns24h && (
              <StatRow label="24h Txns" value={String((token as never as { txns24h: number }).txns24h)} colors={colors} />
            )}
          </View>

          {/* Swap CTA */}
          <Pressable
            style={[styles.swapCta, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/swap" as never)}
          >
            <Ionicons name="swap-horizontal" size={18} color="#fff" />
            <Text style={styles.swapCtaText}>Swap {token.symbol}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Token not found</Text>
        </View>
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
  headerLogo: { width: 100, height: 30 },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, padding: 20 },
  logoWrap: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logo: { width: 56, height: 56 },
  logoFallback: { fontFamily: "Inter_700Bold", fontSize: 24 },
  heroText: { gap: 4 },
  tokenName: { fontFamily: "Inter_700Bold", fontSize: 20 },
  tokenSymbol: { fontFamily: "Inter_400Regular", fontSize: 14 },
  priceSection: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  price: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -1 },
  changeBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  changeText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  description: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, paddingHorizontal: 20, paddingBottom: 16 },
  statsCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  statValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  swapCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, borderRadius: 12, paddingVertical: 16 },
  swapCtaText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  notFound: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
