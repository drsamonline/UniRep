import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { IntensityBadge } from "@/components/IntensityBadge";
import { useColors } from "@/hooks/useColors";
import type { SelectedSymptom } from "@/types";

interface Props {
  item: SelectedSymptom;
  onRemove: () => void;
  onChangeIntensity: (intensity: 1 | 2 | 3) => void;
}

export function SymptomTag({ item, onRemove, onChangeIntensity }: Props) {
  const colors = useColors();
  const nextIntensity: 1 | 2 | 3 = item.intensity === 3 ? 1 : ((item.intensity + 1) as 1 | 2 | 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.left}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {item.symptom.name}
        </Text>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>
          {item.symptom.category}
        </Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity onPress={() => onChangeIntensity(nextIntensity)}>
          <IntensityBadge intensity={item.intensity} small />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.removeBtn}
        >
          <Feather name="x" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  left: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
  },
  category: {
    fontSize: 11,
    textTransform: "capitalize",
    marginTop: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  removeBtn: {},
});
