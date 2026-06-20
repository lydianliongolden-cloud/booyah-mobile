import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function resolveAvatarUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("file://")) return url;
  const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
  if (url.startsWith("/objects/")) return `${base}/api/storage${url}`;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const colors = useColors();
  const initial = (name ?? "?")[0].toUpperCase();

  if (uri && !uri.startsWith("data:")) {
    return (
      <Image
        source={{ uri: resolveAvatarUrl(uri) }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary + "33",
          borderColor: colors.primary + "55",
        },
      ]}
    >
      <Text style={[styles.initial, { color: colors.primary, fontSize: size * 0.4 }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: "cover",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  initial: {
    fontFamily: "Inter_700Bold",
  },
});
