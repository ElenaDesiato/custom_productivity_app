import { router, useFocusEffect } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";

import { useGoalsStore } from '@/stores/goalsStore';
import { useTasksStore } from '@/stores/tasksStore';
import { useTimeTrackingStore } from "@/stores/timeTrackingStore";

// Import useEffect and useCallback
import { useCallback } from 'react';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  // Zustand selectors
  const timerState = useTimeTrackingStore(s => s.timerState);
  const timeEntries = useTimeTrackingStore(s => s.timeEntries);
  const projects = useTimeTrackingStore(s => s.projects);
  const loadData = useTimeTrackingStore(s => s.loadData);
  const tasks = useTasksStore(s => s.tasks);
  const lists = useTasksStore(s => s.lists);
  const reloadTasks = useTasksStore(s => s.reloadTasks);
  const goals = useGoalsStore(s => s.goals);

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const cardBackgroundColor = "#F5F5F5";

  // Load data when screen comes into focus

  // Always reload tasks from AsyncStorage when this screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
      reloadTasks();
    }, [loadData, reloadTasks])
  );

  const today = new Date();
  today.setHours(0,0,0,0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  const todayIdx = today.getDay();

  // Productive time
  const todayEntries = timeEntries
    .filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate.toDateString() === today.toDateString();
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const totalTodayHours = todayEntries.reduce((total, entry) => {
    const duration = entry.endTime ? 
      (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60) : 0;
    return total + duration;
  }, 0);

  // Completed tasks today: count only those completed today
  const completedTasksToday = tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    return (
      completedDate.getFullYear() === today.getFullYear() &&
      completedDate.getMonth() === today.getMonth() &&
      completedDate.getDate() === today.getDate()
    );
  }).length;

  // Completed goals today
  const completedGoalsToday = goals.filter(g => g.completedDates?.includes(todayStr)).length;

  // Helper function to get task info for both organization and time-tracking tasks
  const getTaskInfo = (taskId: string) => {
    // Try organization tasks first
    const orgTask = tasks.find(t => t.id === taskId);
    if (orgTask) {
      return {
        displayName: orgTask.name,
        projectColor: '#1976D2',
        taskColor: undefined
      };
    }
    // Try time-tracking tasks
    const ttTask = useTimeTrackingStore.getState().tasks.find(t => t.id === taskId);
    if (ttTask) {
      // Find project for color
      const project = projects.find(p => p.id === ttTask.projectId);
      return {
        displayName: ttTask.name,
        projectColor: project?.color || '#388E3C',
        taskColor: ttTask.color || project?.color || '#388E3C',
      };
    }
    return { displayName: 'Untitled Task', projectColor: '#999', taskColor: undefined };
  };

  const quickActions = [
    {
      title: "Start Timer",
      icon: "timer" as const,
      route: "/time-tracking/timer" as const,
      color: "#388E3C", // green 700
    },
    {
      title: "View Timesheet",
      icon: "schedule" as const,
      route: "/time-tracking/timesheet" as const,
      color: "#43A047", // green 600
    },
    {
      title: "View To-do List",
      icon: "checklist" as const,
      route: "/organization/tasks" as const,
      color: "#1976D2", // blue 700
    },
    {
      title: "View Goals",
      icon: "flag" as const,
      route: "/organization/goals" as const,
      color: "#42A5F5", // blue 400
    },
    {
      title: "View Lister",
      icon: "list" as const,
      route: "/organization/lister" as const,
      color: "#90CAF9", // blue 200
    },
    {
      title: "",
      icon: undefined,
      route: undefined,
      color: "#fff",
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
            <IconSymbol name="timer" size={24} color="#1B5E20" />
            <ThemedText type="secondary" style={styles.statValue}>
              {totalTodayHours.toFixed(1)}h
            </ThemedText>
            <ThemedText type="secondary" style={styles.statLabel}>
              Productive Time
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}> 
            <IconSymbol name="checklist" size={24} color="#1976D2" />
            <ThemedText type="secondary" style={styles.statValue}>
              {completedTasksToday}
            </ThemedText>
            <ThemedText type="secondary" style={styles.statLabel}>
              Completed Tasks
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}> 
            <IconSymbol name="flag" size={24} color="#42A5F5" />
            <ThemedText type="secondary" style={styles.statValue}>
              {completedGoalsToday}
            </ThemedText>
            <ThemedText type="secondary" style={styles.statLabel}>
              Completed Goals
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
              ]}
              onPress={() => action.route && handleNavigation(action.route)}
              disabled={!action.route}
            >
              {action.icon && (
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <IconSymbol name={action.icon} size={20} color="white" />
                </View>
              )}
              {action.title && (
                <ThemedText type="secondary" style={styles.actionTitle}>
                  {action.title}
                </ThemedText>
              )}
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

      {/* Recent Activity: 5 most recent of timesheet entry, task completion, goal completion */}
      <ThemedView style={[styles.recentSection, { backgroundColor }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Recent Activity
        </ThemedText>
        <View style={styles.recentList}>
          {
            // Gather all recent items for today
            [
              // Timesheet entries (endTime today)
              ...timeEntries
                .filter(entry => entry.endTime && new Date(entry.endTime).toDateString() === today.toDateString())
                .map(entry => ({
                  type: 'time' as const,
                  date: entry.endTime ? new Date(entry.endTime) : today,
                  entry,
                })),
              // Completed tasks (completedAt today)
              ...tasks
                .filter(t => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === today.toDateString())
                .map(t => ({
                  type: 'task' as const,
                  date: t.completedAt ? new Date(t.completedAt) : today,
                  task: t,
                })),
              // Completed goals (completedDates includes todayStr)
              ...goals
                .filter(g => g.completedDates?.includes(todayStr))
                .map(g => ({
                  type: 'goal' as const,
                  date: today,
                  goal: g,
                })),
            ]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5)
            .map((item, idx) => {
              if (item.type === 'time' && 'entry' in item) {
                const entry = item.entry;
                const taskInfo = getTaskInfo(entry.taskId);
                return (
                  <View key={`time-${entry.id}`} style={styles.recentItem}>
                    <View style={styles.recentItemContent}>
                      <View style={styles.taskInfoContainer}>
                        <IconSymbol name="timer" size={16} color="#388E3C" />
                        <ThemedText type="default" style={styles.recentItemTitle}>
                          {taskInfo.displayName}
                        </ThemedText>
                      </View>
                      <ThemedText type="default" style={styles.recentItemTime}>
                        {formatTime(entry.startTime.toString())} - {formatTime(entry.endTime?.toString() || '')}
                      </ThemedText>
                    </View>
                    <ThemedText type="secondary" style={styles.recentItemDuration}>
                      {formatDuration(entry.startTime.toString(), entry.endTime?.toString())}
                    </ThemedText>
                  </View>
                );
              } else if (item.type === 'task' && 'task' in item) {
                const task = item.task;
                return (
                  <View key={`task-${task.id}`} style={styles.recentItem}>
                    <View style={styles.recentItemContent}>
                      <View style={styles.taskInfoContainer}>
                        <IconSymbol name="checklist" size={16} color="#1976D2" />
                        <ThemedText type="default" style={styles.recentItemTitle}>
                          {task.name}
                        </ThemedText>
                      </View>
                      <ThemedText type="default" style={styles.recentItemTime}>
                        {formatTime(task.completedAt || '')}
                      </ThemedText>
                    </View>
                    <ThemedText type="secondary" style={styles.recentItemDuration}>
                      Completed
                    </ThemedText>
                  </View>
                );
              } else if (item.type === 'goal' && 'goal' in item) {
                const goal = item.goal;
                // Try to find a completion date string for today
                let completionDateStr = todayStr;
                if (goal.completedDates && goal.completedDates.length > 0) {
                  // Find the most recent completion for today
                  const todayCompletion = goal.completedDates.find(d => d === todayStr);
                  if (todayCompletion) {
                    // Format as 'Sep 2, 2025'
                    const dateObj = new Date(todayCompletion);
                    completionDateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  }
                }
                return (
                  <View key={`goal-${goal.id}`} style={styles.recentItem}>
                    <View style={styles.recentItemContent}>
                      <View style={styles.taskInfoContainer}>
                        <IconSymbol name="flag" size={16} color="#42A5F5" />
                        <ThemedText type="default" style={styles.recentItemTitle}>
                          {goal.description}
                        </ThemedText>
                      </View>
                      <ThemedText type="default" style={styles.recentItemTime}>
                        {completionDateStr}
                      </ThemedText>
                    </View>
                    <ThemedText type="secondary" style={styles.recentItemDuration}>
                      Completed
                    </ThemedText>
                  </View>
                );
              }
              return null;
            })
          }
        </View>
      </ThemedView>
    </ScrollView>
  );
}

// Helper functions
function getGreeting(): string {
  return "Welcome back";
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString([], { 
    month: 'short',
    day: 'numeric',
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
    marginBottom: 0,
  },
  summarySection: {
    padding: 20,
    marginTop: 0, 
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
    justifyContent: "flex-start",
  },
  actionCard: {
    width: '30%',
    maxWidth: 120,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
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
  taskInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
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
