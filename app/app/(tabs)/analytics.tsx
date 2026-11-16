import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HorizontalBarChart, MiniBarChart } from "@/components/MiniBarChart";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { Case } from "@/types";

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: color + "1a" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Feather name={icon as any} size={15} color="#3b82f6" />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getCasesForAnalytics, cases } = useApp();
  const analytics = getCasesForAnalytics();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 0;

  const recentCases = cases.slice(0, 5);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analytics</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Practice overview</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 16 }]}>
        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Total Cases" value={analytics.total} icon="folder" color="#3b82f6" />
          <StatCard label="This Month" value={analytics.thisMonth} icon="calendar" color="#8b5cf6" />
          <StatCard label="Active" value={analytics.active} icon="activity" color="#2563eb" />
          <StatCard label="Completed" value={analytics.completed} icon="check-circle" color="#16a34a" />
        </View>

        {/* Cases Over Time */}
        <SectionCard title="Cases Over Time (12 months)" icon="trending-up">
          {analytics.monthlyData.every((d) => d.count === 0) ? (
            <View style={styles.emptyChart}>
              <Text style={[styles.emptyChartText, { color: colors.mutedForeground }]}>No case data yet</Text>
            </View>
          ) : (
            <MiniBarChart data={analytics.monthlyData.map((d) => ({ label: d.month, value: d.count }))} color="#3b82f6" height={100} />
          )}
        </SectionCard>

        {/* Top Medicines */}
        <SectionCard title="Top Prescribed Remedies" icon="award">
          {analytics.topRemedies.length === 0 ? (
            <View style={styles.emptyChart}>
              <Text style={[styles.emptyChartText, { color: colors.mutedForeground }]}>No prescriptions yet</Text>
            </View>
          ) : (
            <HorizontalBarChart
              data={analytics.topRemedies.map((r) => ({ label: r.code, value: r.count }))}
              color="#3b82f6"
            />
          )}
        </SectionCard>

        {/* Status Breakdown */}
        <SectionCard title="Cases by Status" icon="pie-chart">
          <View style={styles.statusRows}>
            {[
              { status: "active" as const, count: analytics.active },
              { status: "completed" as const, count: analytics.completed },
              { status: "follow-up" as const, count: analytics.followUp },
              { status: "temporary" as const, count: analytics.total - analytics.active - analytics.completed - analytics.followUp },
            ].map((item) => (
              <View key={item.status} style={styles.statusRow}>
                <StatusBadge status={item.status} small />
                <View style={[styles.statusTrack, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.statusFill,
                      {
                        width: analytics.total > 0 ? `${(item.count / analytics.total) * 100}%` : "0%",
                        backgroundColor: item.status === "active" ? "#3b82f6" : item.status === "completed" ? "#22c55e" : item.status === "follow-up" ? "#f59e0b" : "#9ca3af",
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.statusCount, { color: colors.mutedForeground }]}>{item.count}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Recent Cases */}
        <SectionCard title="Recent Cases" icon="clock">
          {recentCases.length === 0 ? (
            <View style={styles.emptyChart}>
              <Text style={[styles.emptyChartText, { color: colors.mutedForeground }]}>No cases yet</Text>
            </View>
          ) : (
            recentCases.map((c) => (
              <View key={c.id} style={[styles.recentRow, { borderBottomColor: colors.border }]}>
                <View style={styles.recentInfo}>
                  <Text style={[styles.recentNum, { color: "#3b82f6" }]}>{c.caseNumber}</Text>
                  <Text style={[styles.recentName, { color: colors.foreground }]}>{c.patientName}</Text>
                  {c.chiefComplaint ? (
                    <Text style={[styles.recentComplaint, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {c.chiefComplaint}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.recentRight}>
                  <StatusBadge status={c.status} small />
                  <Text style={[styles.recentDate, { color: colors.mutedForeground }]}>
                    {new Date(c.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 1 },
  content: { padding: 16, gap: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1,
    minWidth: "44%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  statValue: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 12 },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  emptyChart: { alignItems: "center", paddingVertical: 20 },
  emptyChartText: { fontSize: 13 },
  statusRows: { gap: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  statusFill: { height: 8, borderRadius: 4 },
  statusCount: { width: 24, textAlign: "right", fontSize: 13, fontWeight: "600" },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recentInfo: { flex: 1, marginRight: 10 },
  recentNum: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
  recentName: { fontSize: 14, fontWeight: "600" },
  recentComplaint: { fontSize: 12, marginTop: 2 },
  recentRight: { alignItems: "flex-end", gap: 4 },
  recentDate: { fontSize: 11 },
});
