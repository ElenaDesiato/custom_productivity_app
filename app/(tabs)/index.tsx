import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useTimeTracking } from "@/hooks/useTimeTracking";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { timerState, timeEntries, projects, tasks, loadData } = useTimeTracking();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const cardBackgroundColor = "#F5F5F5";

  // Load data when screen comes into focus
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const today = new Date();
  const todayEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.startTime);
    return entryDate.toDateString() === today.toDateString();
  });

  const totalTodayHours = todayEntries.reduce((total, entry) => {
    const duration = entry.endTime ? 
      (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60) : 0;
    return total + duration;
  }, 0);

  const quickActions = [
    {
      title: "Start Timer",
      icon: "timer" as const,
      route: "/time-tracking/timer" as const,
      color: "#4CAF50",
      disabled: timerState.isRunning,
    },
    {
      title: "Add Task or Project",
      icon: "add-task" as const,
      route: "/time-tracking/tasks" as const,
      color: "#2196F3",
    },
    {
      title: "View Calendar",
      icon: "calendar" as const,
      route: "/calendar" as const,
      color: "#FF9800",
    },
    {
      title: "View Todo List",
      icon: "checkmark.circle" as const,
      route: "/todo-list" as const,
      color: "#9C27B0",
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <ThemedView style={[styles.header, { backgroundColor }]}>
        <ThemedText type="title" style={styles.greeting}>
          {getGreeting()}
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Let's make today productive
        </ThemedText>
      </ThemedView>

      {/* Today's Summary */}
      <ThemedView style={[styles.summarySection, { backgroundColor }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Today's Progress
        </ThemedText>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}>
            <IconSymbol name="timer" size={24} color="#4CAF50" />
            <ThemedText type="secondary" style={styles.statValue}>
              {totalTodayHours.toFixed(1)}h
            </ThemedText>
            <ThemedText type="secondary" style={styles.statLabel}>
              Productive Time
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}>
            <IconSymbol name="checkmark.circle" size={24} color="#2196F3" />
            <ThemedText type="secondary" style={styles.statValue}>
              N/A
            </ThemedText>
            <ThemedText type="secondary" style={styles.statLabel}>
              Completed Tasks
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}>
            <IconSymbol name="calendar" size={24} color="#FF9800" />
            <ThemedText type="secondary" style={styles.statValue}>
              N/A
            </ThemedText>
            <ThemedText type="secondary" style={styles.statLabel}>
              Upcoming Events
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={[styles.actionsSection, { backgroundColor }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Quick Actions
        </ThemedText>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionCard,
                { backgroundColor: cardBackgroundColor },
                action.disabled && styles.actionCardDisabled
              ]}
              onPress={() => !action.disabled && handleNavigation(action.route)}
              disabled={action.disabled}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <IconSymbol name={action.icon} size={20} color="white" />
              </View>
              <ThemedText type="secondary" style={styles.actionTitle}>
                {action.title}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>

      {/* Active Timer Banner */}
      {timerState.isRunning && (
        <ThemedView style={styles.activeTimerBanner}>
          <View style={styles.timerBannerContent}>
            <IconSymbol name="timer" size={20} color="white" />
            <ThemedText style={styles.timerBannerText}>
              Timer is currently running
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.viewTimerButton}
            onPress={() => handleNavigation('/time-tracking/timer')}
          >
            <ThemedText style={styles.viewTimerButtonText}>View</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* Recent Activity */}
      {todayEntries.length > 0 && (
        <ThemedView style={[styles.recentSection, { backgroundColor }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Activity
          </ThemedText>
          <View style={styles.recentList}>
            {todayEntries.slice(0, 3).map((entry, index) => (
              <View key={index} style={styles.recentItem}>
                <View style={styles.recentItemContent}>
                  <ThemedText type="secondary" style={styles.recentItemTitle}>
                    {entry.taskName || 'Untitled Task'}
                  </ThemedText>
                  <ThemedText type="secondary" style={styles.recentItemTime}>
                    {formatTime(entry.startTime)}
                  </ThemedText>
                </View>
                <ThemedText type="secondary" style={styles.recentItemDuration}>
                  {formatDuration(entry.startTime, entry.endTime)}
                </ThemedText>
              </View>
            ))}
          </View>
        </ThemedView>
      )}
    </ScrollView>
  );
}

// Helper functions
function getGreeting(): string {
  return "Welcome back";
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatDuration(startTime: string, endTime?: string): string {
  if (!endTime) return "In progress";
  const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60);
  return `${Math.round(duration)}m`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  summarySection: {
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  actionsSection: {
    padding: 20,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.7,
  },
  activeTimerBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4CAF50",
    margin: 20,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
  },
  timerBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timerBannerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  viewTimerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewTimerButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  recentSection: {
    padding: 20,
    marginTop: 8,
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  recentItemTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  recentItemDuration: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4CAF50",
  },
});
