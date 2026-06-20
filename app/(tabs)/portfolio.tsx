import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useListTokens } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { Pressable } from "react-native";

const MOCK_HOLDINGS = [
  { symbol: "SOL", amount: 4.25 },
  { symbol: "BOO!", amount: 500 },
  { symbol: "BTC", amount: 0.0012 },
  { symbol: "JUP", amount: 120 },
];

function fmtUsd(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(2)}`;
}

export default function PortfolioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: tokens, isLoading } = useListTokens({ limit: 100 });

  const holdings = useMemo(() => {
    if (!tokens) return [];
    return MOCK_HOLDINGS.map((h) => {
      const token = tokens.find((t) => t.symbol === h.symbol);
      const value = token ? h.amount * token.price : 0;
      const change = token?.priceChange24h ?? 0;
      return { ...h, token, value, change };
    }).filter((h) => h.token);
  }, [tokens]);

  const totalValue = useMemo(() => holdings.reduce((s, h) => s + h.value, 0), [holdings]);
  const totalChange = useMemo(() => {
    if (!holdings.length) return 0;
    return holdings.reduce((s, h) => s + h.change * h.value, 0) / totalValue;
  }, [holdings, totalValue]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Ionicons name="pie-chart-outline" size={56} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Track your portfolio</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Sign in to see your holdings and P&L
        </Text>
        <Pressable
          style={[styles.signInBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/auth" as never)}
        >
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Portfolio</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={holdings}
          keyExtractor={(h) => h.symbol}
          ListHeaderComponent={
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total value</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {fmtUsd(totalValue)}
              </Text>
              <View style={[styles.changeBadge, { backgroundColor: (totalChange >= 0 ? colors.success : colors.destructive) + "22" }]}>
                <Ionicons
                  name={totalChange >= 0 ? "trending-up" : "trending-down"}
                  size={14}
                  color={totalChange >= 0 ? colors.success : colors.destructive}
                />
                <Text style={[styles.changeText, { color: totalChange >= 0 ? colors.success : colors.destructive }]}>
                  {totalChange >= 0 ? "+" : ""}{totalChange.toFixed(2)}% today
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.holdingRow, { borderBottomColor: colors.border }]}
              onPress={() => router.push(`/token/${item.symbol}` as never)}
            >
              <View style={styles.holdingLeft}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <View>
                  <Text style={[styles.holdingSymbol, { color: colors.foreground }]}>{item.symbol}</Text>
                  <Text style={[styles.holdingAmount, { color: colors.mutedForeground }]}>
                    {item.amount} {item.symbol}
                  </Text>
                </View>
              </View>
              <View style={styles.holdingRight}>
                <Text style={[styles.holdingValue, { color: colors.foreground }]}>
                  {fmtUsd(item.value)}
                </Text>
                <Text style={[styles.holdingChange, { color: item.change >= 0 ? colors.success : colors.destructive }]}>
                  {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
                </Text>
              </View>
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 84 + botPad, gap: 0 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.5 },
  summaryCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 6,
    alignItems: "center",
  },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  summaryValue: { fontFamily: "Inter_700Bold", fontSize: 36, letterSpacing: -1 },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  changeText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  holdingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  holdingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  holdingSymbol: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  holdingAmount: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  holdingRight: { alignItems: "flex-end", gap: 2 },
  holdingValue: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  holdingChange: { fontFamily: "Inter_400Regular", fontSize: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, marginTop: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  signInBtn: { borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  signInText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});
