import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Token {
  symbol: string;
  name: string;
  price: number;
  priceChange24h?: number | null;
  volume24h?: number | null;
  marketCap?: number | null;
  logoUrl?: string | null;
  chain?: string | null;
}

function fmt(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPrice(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.00001) return `$${n.toExponential(2)}`;
  if (n < 0.001) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  if (n < 1000) return `$${n.toFixed(2)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface TokenRowProps {
  token: Token;
  rank?: number;
}

export function TokenRow({ token, rank }: TokenRowProps) {
  const colors = useColors();
  const change = token.priceChange24h ?? 0;
  const isUp = change >= 0;
  const changeColor = isUp ? colors.success : colors.destructive;

  return (
    <Pressable
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/token/${token.symbol}` as never)}
    >
      <View style={styles.left}>
        {rank !== undefined && (
          <Text style={[styles.rank, { color: colors.mutedForeground }]}>{rank}</Text>
        )}
        <View style={[styles.logo, { backgroundColor: colors.muted }]}>
          {token.logoUrl ? (
            <Image source={{ uri: token.logoUrl }} style={styles.logoImage} contentFit="contain" />
          ) : (
            <Text style={[styles.logoFallback, { color: colors.primary }]}>
              {token.symbol[0]}
            </Text>
          )}
        </View>
        <View style={styles.nameCol}>
          <Text style={[styles.symbol, { color: colors.foreground }]}>{token.symbol}</Text>
          <Text style={[styles.name, { color: colors.mutedForeground }]} numberOfLines={1}>
            {token.name}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.price, { color: colors.foreground }]}>{fmtPrice(token.price)}</Text>
        <View style={[styles.badge, { backgroundColor: changeColor + "22" }]}>
          <Text style={[styles.change, { color: changeColor }]}>
            {isUp ? "+" : ""}{change.toFixed(2)}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  rank: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    width: 18,
    textAlign: "right",
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  logoFallback: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  nameCol: {
    gap: 2,
    flex: 1,
  },
  symbol: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  name: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  price: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  change: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
});
