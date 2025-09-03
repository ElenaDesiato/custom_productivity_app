import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTimeTrackingStore } from '@/stores/timeTrackingStore';
import { router, useFocusEffect } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';


export default function TimeTrackingIndexScreen() {
  const colorScheme = useColorScheme();
  // Zustand selectors
  const timerState = useTimeTrackingStore(s => s.timerState);
  const timeEntries = useTimeTrackingStore(s => s.timeEntries);
  const projects = useTimeTrackingStore(s => s.projects);
  const tasks = useTimeTrackingStore(s => s.tasks);
  const loadData = useTimeTrackingStore(s => s.loadData);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const navigationItems = useMemo(() => [
    {
      title: 'Timer',
      subtitle: timerState.isRunning ? 'Timer is running' : 'Start tracking time',
      icon: 'timer' as const,
      route: '/time-tracking/timer' as const,
      color: '#1B5E20', // green 900
    },
    {
      title: 'Tasks & Projects',
      subtitle: (
        <>
          <ThemedText style={styles.highlightNumber}>{projects.length}</ThemedText>
          {` projects, `}
          <ThemedText style={styles.highlightNumber}>{tasks.length}</ThemedText>
          {` tasks`}
        </>
      ),
      icon: 'folder' as const,
      route: '/time-tracking/tasks' as const,
      color: '#388E3C', // green 700
    },
    {
      title: 'Timesheet',
      subtitle: (
        <>
          <ThemedText style={styles.highlightNumber}>{timeEntries.length}</ThemedText>
          {` time entr${timeEntries.length === 1 ? 'y' : 'ies'}`}
        </>
      ),
  icon: 'health' as const,
      route: '/time-tracking/timesheet' as const,
      color: '#43A047', // green 600
    },
    {
      title: 'Reports',
      subtitle: 'View analytics and insights',
      icon: 'insert-chart' as const,
      route: '/time-tracking/reports' as const,
      color: '#66BB6A', // green 400
    },
  ], [timerState.isRunning, projects.length, tasks.length, timeEntries.length]);

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>

        <ThemedText style={styles.subtitle}>
          Manage your time more effectively
        </ThemedText>
      </View>

      <View style={styles.navigationGrid}>
        {navigationItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navigationCard}
            onPress={() => handleNavigation(item.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <IconSymbol name={item.icon} size={24} color="white" />
            </View>
            <View style={styles.cardContent}>
              <ThemedText type="secondary" style={styles.cardTitle}>{item.title}</ThemedText>
              <ThemedText type="secondary" style={styles.cardSubtitle}>{item.subtitle}</ThemedText>
            </View>
            <IconSymbol 
              name="chevron.right" 
              size={16} 
              color={Colors[colorScheme ?? 'light'].textSecondary} 
            />
          </TouchableOpacity>
        ))}
      </View>

      {timerState.isRunning && (
        <View style={styles.activeTimerBanner}>
          <IconSymbol name="timer" size={20} color="white" />
          <ThemedText style={styles.activeTimerText}>
            Timer is currently running
          </ThemedText>
          <TouchableOpacity
            style={styles.viewTimerButton}
            onPress={() => handleNavigation('/time-tracking/timer')}
          >
            <ThemedText style={styles.viewTimerButtonText}>View Timer</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  navigationGrid: {
    flex: 1,
  },
  navigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  highlightNumber: {
    color: '#43A047',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 2,
  },
  activeTimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  activeTimerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  viewTimerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewTimerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 