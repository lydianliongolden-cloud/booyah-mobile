import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useListTokens } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";

function fmtPrice(n: number): string {
  if (!n) return "0.00";
  if (n < 0.001) return n.toFixed(6);
  if (n < 1) return n.toFixed(4);
  return n.toFixed(2);
}

export default function SwapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [fromSymbol, setFromSymbol] = useState("SOL");
  const [toSymbol, setToSymbol] = useState("BOO!");
  const [amount, setAmount] = useState("");
  const [swapped, setSwapped] = useState(false);

  const { data: tokens, isLoading } = useListTokens({ limit: 100 });

  const fromToken = useMemo(
    () => tokens?.find((t) => t.symbol === fromSymbol),
    [tokens, fromSymbol],
  );
  const toToken = useMemo(
    () => tokens?.find((t) => t.symbol === toSymbol),
    [tokens, toSymbol],
  );

  const outputAmount = useMemo(() => {
    const amt = parseFloat(amount);
    if (!amt || !fromToken?.price || !toToken?.price) return "";
    const out = (amt * fromToken.price) / toToken.price;
    return fmtPrice(out);
  }, [amount, fromToken, toToken]);

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setAmount("");
  };

  const handleSwap = () => {
    if (!user) { router.push("/auth" as never); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSwapped(true);
    setAmount("");
    setTimeout(() => setSwapped(false), 3000);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 84 + botPad }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Swap</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Powered by Jupiter
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <View style={styles.body}>
          {/* From */}
          <View style={[styles.tokenBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>You pay</Text>
            <View style={styles.tokenRow}>
              <View style={[styles.tokenBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tokenSymbol, { color: colors.primary }]}>{fromSymbol}</Text>
              </View>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.amountInput, { color: colors.foreground }]}
                keyboardType="decimal-pad"
              />
            </View>
            {fromToken && (
              <Text style={[styles.rate, { color: colors.mutedForeground }]}>
                1 {fromSymbol} = ${fmtPrice(fromToken.price)}
              </Text>
            )}
          </View>

          {/* Flip button */}
          <Pressable style={[styles.flipBtn, { backgroundColor: colors.primary }]} onPress={handleFlip}>
            <Ionicons name="swap-vertical" size={20} color="#fff" />
          </Pressable>

          {/* To */}
          <View style={[styles.tokenBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>You receive</Text>
            <View style={styles.tokenRow}>
              <View style={[styles.tokenBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tokenSymbol, { color: colors.accent }]}>{toSymbol}</Text>
              </View>
              <Text style={[styles.outputAmount, { color: outputAmount ? colors.foreground : colors.mutedForeground }]}>
                {outputAmount || "0.00"}
              </Text>
            </View>
            {toToken && (
              <Text style={[styles.rate, { color: colors.mutedForeground }]}>
                1 {toSymbol} = ${fmtPrice(toToken.price)}
              </Text>
            )}
          </View>

          {/* Fee notice */}
          <View style={[styles.feeRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.feeText, { color: colors.mutedForeground }]}>
              0.5% !Booyah! fee · Best price via Jupiter
            </Text>
          </View>

          {swapped && (
            <View style={[styles.successBanner, { backgroundColor: colors.success + "22" }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[styles.successText, { color: colors.success }]}>Swap submitted!</Text>
            </View>
          )}

          <Pressable
            style={[
              styles.swapBtn,
              { backgroundColor: amount ? colors.primary : colors.muted },
            ]}
            onPress={handleSwap}
            disabled={!amount}
          >
            <Text style={[styles.swapBtnText, { color: amount ? "#fff" : colors.mutedForeground }]}>
              {user ? "Swap" : "Sign in to swap"}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 4,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13 },
  body: { paddingHorizontal: 16, gap: 4, alignItems: "center" },
  tokenBox: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  label: { fontFamily: "Inter_400Regular", fontSize: 12 },
  tokenRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tokenBadge: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tokenSymbol: { fontFamily: "Inter_700Bold", fontSize: 16 },
  amountInput: { fontFamily: "Inter_600SemiBold", fontSize: 24, textAlign: "right", flex: 1 },
  outputAmount: { fontFamily: "Inter_600SemiBold", fontSize: 24 },
  rate: { fontFamily: "Inter_400Regular", fontSize: 12 },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: "100%",
    marginTop: 8,
  },
  feeText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  swapBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  swapBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "100%",
  },
  successText: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
