import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TokenRow } from "@/components/TokenRow";
import { useColors } from "@/hooks/useColors";
import { useListTokens } from "@workspace/api-client-react";

export default function TokensScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const { data: tokens, isLoading, refetch, isRefetching } = useListTokens({ limit: 100 });

  const filtered = useMemo(() => {
    if (!tokens) return [];
    const q = search.toLowerCase();
    if (!q) return tokens;
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
    );
  }, [tokens, search]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Image
          source={require("@/assets/images/booyah-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.mutedForeground }]}>Markets</Text>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.muted }]}>
        <Ionicons name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search tokens…"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Ionicons
            name="close-circle"
            size={16}
            color={colors.mutedForeground}
            onPress={() => setSearch("")}
          />
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.symbol}
          renderItem={({ item, index }) => <TokenRow token={item as Parameters<typeof TokenRow>[0]["token"]} rank={index + 1} />}
          contentContainerStyle={{ paddingBottom: 84 + botPad }}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No tokens found
              </Text>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  logo: { width: 120, height: 36 },
  title: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
