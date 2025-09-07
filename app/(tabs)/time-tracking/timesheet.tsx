import { TaskColorIndicator } from '@/components/TaskColorIndicator';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTimeTrackingStore } from '@/stores/timeTrackingStore';
import { TimeEntry } from '@/types/timeTracking';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
// Remove all react-native-svg and AnimatedRect imports and code

const { width: screenWidth } = Dimensions.get('window');

// Remove ViewHourglass and all related code/styles
// In the inspirationContainerCentered:

const INSPIRATIONAL_MESSAGES = [
  "Small steps every day lead to big results. Keep going!",
  "Progress, not perfection.",
  "Every minute counts—make it productive.",
  "You’re closer than you think.",
  "Consistency is the key to success.",
  "Stay focused and keep moving forward.",
  "Great things take time.",
  "Your future self will thank you.",
  "One task at a time.",
  "Believe in your progress.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don’t watch the clock; do what it does. Keep going.",
  "Dream big. Start small. Act now.",
  "The secret of getting ahead is getting started.",
  "You don’t have to be perfect to be amazing.",
  "Make today count.",
  "Your only limit is you.",
  "Discipline is choosing between what you want now and what you want most.",
  "The best way to get things done is to simply begin.",
  "Little by little, a little becomes a lot."
];


export default function TimesheetScreen() {
  const colorScheme = useColorScheme();
  // Zustand selectors
  const timeEntries = useTimeTrackingStore(s => s.timeEntries);
  const projects = useTimeTrackingStore(s => s.projects);
  const tasks = useTimeTrackingStore(s => s.tasks);
  const getTaskById = useTimeTrackingStore(s => s.getTaskById);
  const deleteTimeEntry = useTimeTrackingStore(s => s.deleteTimeEntry);
  // Subscribe to timerState and elapsedSeconds for live updates
  const timerState = useTimeTrackingStore(s => s.timerState);
  const elapsedSeconds = useTimeTrackingStore(s => s.timerState.elapsedSeconds);
  const loadData = useTimeTrackingStore(s => s.loadData);
  const updateTimeEntry = useTimeTrackingStore(s => s.updateTimeEntry);

  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, -1 = last week, 1 = next week
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editTaskId, setEditTaskId] = useState('');
  const [editStartDate, setEditStartDate] = useState(new Date());
  const [editEndDate, setEditEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startPickerMode, setStartPickerMode] = useState<'date' | 'time'>('date');
  const [endPickerMode, setEndPickerMode] = useState<'date' | 'time'>('date');

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Animation for waving hand
  const waveAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [waveAnim]);
  const rotate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  // In TimesheetScreen, replace the rotate animation with a pulse/scale animation for the hourglass emoji
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [scaleAnim]);

  // Calculate week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    // Calculate the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // We want weeks to start on Monday, so treat Sunday (0) as 7
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    // Calculate the start of the week (Monday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek + 1 + (selectedWeek * 7));
    weekStart.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [selectedWeek]);

  // Get time entries for a specific date
  const getTimeEntriesForDate = (date: Date) => {
    // Get the start and end of the day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    let entries = timeEntries.filter(entry => {
      const entryStart = new Date(entry.startTime);
      const entryEnd = entry.endTime ? new Date(entry.endTime) : null;

      // Entry starts on this day
      const startsToday = entryStart >= dayStart && entryStart <= dayEnd;
      // Entry ends on this day
      const endsToday = entryEnd && entryEnd >= dayStart && entryEnd <= dayEnd;
      // Entry spans the whole day (starts before and ends after)
      const spansToday = entryEnd && entryStart < dayStart && entryEnd > dayEnd;
  // Entry is running and started on this day (no end time yet)
  const isActiveToday = entry.isRunning && startsToday;

  return startsToday || endsToday || spansToday || isActiveToday;
    });

    // Only inject running timer as pseudo-entry if there's no real running entry in the database
    // This handles edge cases where timer state exists but no time entry was created
    if (timerState.isRunning && timerState.currentTaskId && timerState.startTime) {
      const now = new Date();
      const timerStart = new Date(timerState.startTime);
      // If the timer started before the end of this day and now is after the start of this day
      if (timerStart <= dayEnd && now >= dayStart) {
        // Check if there's already a real running entry for this task on this day
        const existingRunningEntry = entries.find(entry => 
          entry.taskId === timerState.currentTaskId && 
          entry.isRunning === true
        );
        
        // Only add pseudo-entry if no real running entry exists (edge case handling)
        if (!existingRunningEntry) {
          // The pseudo-entry should be clipped to this day
          const pseudoStart = timerStart > dayStart ? timerStart : dayStart;
          const pseudoEnd = now < dayEnd ? now : dayEnd;
          const pseudoDuration = Math.floor((pseudoEnd.getTime() - pseudoStart.getTime()) / 1000);
          entries = [
            ...entries,
            {
              id: 'running',
              taskId: timerState.currentTaskId,
              startTime: pseudoStart,
              endTime: undefined,
              duration: pseudoDuration,
            },
          ];
        }
      }
    }
    return entries;
  };

  // Calculate total hours for a date
  const getTotalHoursForDate = (date: Date) => {
    const entries = getTimeEntriesForDate(date);
    // If there is a running timer pseudo-entry for this day, use the current elapsed duration
    return entries.reduce((total, entry) => {
      if (entry.id === 'running' && timerState.isRunning && timerState.startTime) {
        // Calculate up-to-date duration for the running timer
        const now = new Date();
        const timerStart = new Date(timerState.startTime);
        const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
        const pseudoStart = timerStart > dayStart ? timerStart : dayStart;
        const pseudoEnd = now;
        const runningDuration = Math.floor((pseudoEnd.getTime() - pseudoStart.getTime()) / 1000);
        return total + runningDuration;
      }
      return total + (entry.duration || 0);
    }, 0) / 3600;
  };

  // Calculate total hours for the week
  const getTotalWeekHours = () => {
    return weekDates.reduce((total, date) => total + getTotalHoursForDate(date), 0);
  };

  // Get project and task colors for a date
  const getProjectColorsForDate = (date: Date) => {
    const entries = getTimeEntriesForDate(date);
    const colorPairs = entries.map(entry => {
      const task = getTaskById(entry.taskId);
      const project = projects.find(p => p.id === task?.projectId);
      return {
        projectColor: project?.color || '#808080',
        taskColor: task?.color,
      };
    });
    
    // Remove duplicates based on both project and task colors
    const uniqueColors = colorPairs.filter((pair, index, self) => 
      index === self.findIndex(p => 
        p.projectColor === pair.projectColor && p.taskColor === pair.taskColor
      )
    );
    
    return uniqueColors;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Handle week navigation
  const handleWeekChange = (direction: 'left' | 'right') => {
    setSelectedWeek(prev => prev + (direction === 'left' ? -1 : 1));
    setSelectedDay(null); // Reset selected day when changing weeks
  };

  // Handle day selection
  const handleDayPress = (date: Date) => {
    const entries = getTimeEntriesForDate(date);
    if (entries.length > 0) {
      setSelectedDay(selectedDay?.toDateString() === date.toDateString() ? null : date);
    } else {
      // Show the day even if it has no entries, so we can display a message
      setSelectedDay(selectedDay?.toDateString() === date.toDateString() ? null : date);
    }
  };

  // Handle edit time entry
  const handleEditEntry = (entry: TimeEntry) => {
    if (entry.id === 'running') return; // Don't allow editing running timer
    
    setEditingEntry(entry);
    setEditTaskId(entry.taskId);
    setEditStartDate(new Date(entry.startTime));
    // For end date, if no end time exists, use start time + 1 hour as default
    setEditEndDate(entry.endTime ? new Date(entry.endTime) : new Date(entry.startTime.getTime() + 3600000));
    setShowEditModal(true);
    // Reset picker modes
    setStartPickerMode('date');
    setEndPickerMode('date');
  };

  // Handle edit submission
  const handleEditSubmit = async () => {
    if (!editingEntry || !editTaskId) return;

    const newDuration = Math.floor((editEndDate.getTime() - editStartDate.getTime()) / 1000);
    
    await updateTimeEntry(editingEntry.id, {
      taskId: editTaskId,
      startTime: editStartDate,
      endTime: editEndDate,
      duration: newDuration,
    });

    setShowEditModal(false);
    setEditingEntry(null);
  };

  // Memoized onChange handlers for DateTimePicker
  const handleStartDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (selectedDate) {
      if (startPickerMode === 'date') {
        // First step: date selected, now show time picker
        setEditStartDate(selectedDate);
        setStartPickerMode('time');
      } else {
        // Second step: time selected, complete the selection
        const newDate = new Date(editStartDate);
        newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        setEditStartDate(newDate);
        setShowStartPicker(false);
        setStartPickerMode('date'); // Reset for next time
      }
    } else {
      setShowStartPicker(false);
      setStartPickerMode('date'); // Reset for next time
    }
  }, [startPickerMode, editStartDate]);

  const handleEndDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (selectedDate) {
      if (endPickerMode === 'date') {
        // First step: date selected, now show time picker
        setEditEndDate(selectedDate);
        setEndPickerMode('time');
      } else {
        // Second step: time selected, complete the selection
        const newDate = new Date(editEndDate);
        newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        setEditEndDate(newDate);
        setShowEndPicker(false);
        setEndPickerMode('date'); // Reset for next time
      }
    } else {
      setShowEndPicker(false);
      setEndPickerMode('date'); // Reset for next time
    }
  }, [endPickerMode, editEndDate]);

  // Remove all react-native-svg and AnimatedRect imports and code

  const [inspiration, setInspiration] = React.useState(INSPIRATIONAL_MESSAGES[0]);
  React.useEffect(() => {
    setInspiration(INSPIRATIONAL_MESSAGES[Math.floor(Math.random() * INSPIRATIONAL_MESSAGES.length)]);
  }, []);

  // Format time entry periods for display
  const formatTimeEntryPeriods = (entry: TimeEntry) => {
    if (entry.id === 'running' || entry.isRunning) {
      return `${new Date(entry.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })} - Running`;
    }
    // Completed entry
    return `${new Date(entry.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${entry.endTime ? new Date(entry.endTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }) : 'Running'}`;
  };

  return (
    <ThemedView style={styles.container}>
      {!selectedDay ? (
        <>
          {/* Week Navigation Header */}
          <View style={styles.weekHeader}>
            <TouchableOpacity
              style={styles.weekNavButton}
              onPress={() => handleWeekChange('left')}
            >
              <IconSymbol name="chevron-left" size={24} color={Colors[colorScheme ?? 'light'].textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.weekInfo}>
              <ThemedText type="secondary" style={styles.weekTitle}>
                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </ThemedText>
              <ThemedText type="secondary" style={styles.weekTotal}>
                {(Number(getTotalWeekHours())).toFixed(1) + 'h total'}
              </ThemedText>
            </View>
            
            <View style={styles.weekNavButtons}>
              
              <TouchableOpacity
                style={styles.weekNavButton}
                onPress={() => handleWeekChange('right')}
              >
                <IconSymbol name="chevron-right" size={24} color={Colors[colorScheme ?? 'light'].textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Days of the Week */}
          <View style={styles.daysContainer}>
            {weekDates.map((date, index) => {
              const totalHours = getTotalHoursForDate(date);
              const projectColors = getProjectColorsForDate(date);
              const isTodayDate = isToday(date);
              const hasEntries = getTimeEntriesForDate(date).length > 0;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayRow,
                    isTodayDate && styles.todayRow,
                    hasEntries && styles.hasEntriesRow,
                  ]}
                  onPress={() => handleDayPress(date)}
                >
                  <View style={styles.dayInfo}>
                    <ThemedText type="secondary" style={[styles.dayName, isTodayDate && styles.todayText]}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </ThemedText>
                    
                    <ThemedText type="secondary" style={[styles.dayDate, isTodayDate && styles.todayText]}>
                      {date.getDate()}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.dayStats}>
                    <ThemedText type="secondary" style={[styles.dayHours, isTodayDate && styles.todayText]}>
                      {totalHours > 0 ? `${totalHours.toFixed(1)}h` : '0h'}
                    </ThemedText>

                    {projectColors.length > 0 && (
                      <View style={styles.projectIndicators}>
                        {projectColors.slice(0, 3).map((colorPair, colorIndex) => (
                          <TaskColorIndicator
                            key={colorIndex}
                            projectColor={colorPair.projectColor}
                            taskColor={colorPair.taskColor}
                            size={8}
                          />
                        ))}
                        {projectColors.length > 3 && (
                          <ThemedText type="secondary" style={styles.moreIndicator}>
                            +{projectColors.length - 3}
                          </ThemedText>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {timeEntries.length === 0 && (
            <View style={styles.emptyState}>
              <IconSymbol name="health" size={48} color={Colors[colorScheme ?? 'light'].textSecondary} />
              <ThemedText type="secondary" style={styles.emptyTitle}>No Time Entries</ThemedText>
              <ThemedText type="secondary" style={styles.emptyText}>
                Start tracking your time to see it here.
              </ThemedText>
            </View>
          )}

          {/* Subtle animation and inspirational message for empty bottom half */}
          <View style={styles.inspirationContainerCentered}>
            <Animated.Text
              style={[
                styles.hourglass,
                { transform: [{ scale: scaleAnim }] },
              ]}
              accessibilityLabel="Hourglass"
            >
              ⏳
            </Animated.Text>
            <ThemedText style={styles.inspirationText}>
              {inspiration}
            </ThemedText>
          </View>
        </>
      ) : (
        /* Selected Day Entries - Full Screen */
        <View style={styles.selectedDayContainer}>
          <View style={styles.selectedDayHeader}>
            <ThemedText type="secondary" style={styles.selectedDayTitle}>
              {selectedDay.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </ThemedText>
            <TouchableOpacity
              onPress={() => setSelectedDay(null)}
              style={styles.closeButton}
            >
              <IconSymbol name="close" size={20} color={Colors[colorScheme ?? 'light'].textSecondary} />
            </TouchableOpacity>
          </View>

          {getTimeEntriesForDate(selectedDay).length > 0 ? (
            <ScrollView style={[styles.entriesList, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
              {getTimeEntriesForDate(selectedDay).map((entry, index) => {
                const task = getTaskById(entry.taskId);
                const project = projects.find(p => p.id === task?.projectId);
                
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <View style={styles.entryInfo}>
                        <TaskColorIndicator
                          projectColor={project?.color || '#808080'}
                          taskColor={task?.color}
                          size={16}
                        />
                        <View style={styles.entryDetails}>
                          <ThemedText type="secondary" style={styles.entryTaskName}>
                            {task?.name || 'Unknown Task'}
                          </ThemedText>
                          <ThemedText type="secondary" style={styles.entryProjectName}>
                            {project?.name || 'Unknown Project'}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.entryStatus}>
                        {(entry.isRunning || entry.id === 'running') && (
                          <IconSymbol name="timer" size={16} color="#4CAF50" />
                        )}
                        {/* Pause feature removed: no isPaused */}
                        <ThemedText type="secondary" style={styles.entryDuration}>
                          {entry.isRunning ? 
                            formatTime(timerState.elapsedSeconds) : 
                            formatTime(entry.duration || 0)
                          }
                        </ThemedText>
                        {entry.id !== 'running' && (
                          <TouchableOpacity
                            onPress={() => handleEditEntry(entry)}
                            style={styles.editButton}
                          >
                            <IconSymbol name="edit" size={16} color="#4CAF50" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <View style={styles.entryTime}>
                      <ThemedText type="secondary" style={styles.entryTimeText}>
                        {formatTimeEntryPeriods(entry)}
                      </ThemedText>
                      {entry.id !== 'running' && (
                        <TouchableOpacity
                          onPress={() => deleteTimeEntry(entry.id)}
                          style={styles.deleteButton}
                        >
                          <IconSymbol name="close" size={16} color="#FF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noEntriesMessage}>
              <IconSymbol name="timer" size={32} color={Colors[colorScheme ?? 'light'].textSecondary} />
              <ThemedText type="secondary" style={styles.noEntriesTitle}>
                {isToday(selectedDay) ? 'No time tracked today yet' : 'No time tracked on this day'}
              </ThemedText>
              <ThemedText type="secondary" style={styles.noEntriesText}>
                {isToday(selectedDay) 
                  ? 'Start tracking your time to see your entries here.' 
                  : 'This day has no time tracking entries.'
                }
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Edit Time Entry Modal */}
      <Modal
  visible={showEditModal}
  animationType="fade"
  transparent={true}
      >

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <ScrollView contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }} style={{ width: '100%' }}>
            <View style={[styles.modalCardCompact, { backgroundColor: colorScheme === 'dark' ? '#22292f' : '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, borderRadius: 16, maxWidth: 420, width: '96%' }] }>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'left' }}>Edit Time Entry</ThemedText>
                <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ padding: 4 }}>
                  <IconSymbol name="close" size={24} color={colorScheme === 'dark' ? '#fff' : '#22292f'} />
                </TouchableOpacity>
              </View>
              <View style={{ height: 1, backgroundColor: '#fff', opacity: 0.7, marginBottom: 16 }} />
              <ScrollView style={{ maxHeight: 400, borderRadius: 8, borderWidth: 1, backgroundColor: colorScheme === 'dark' ? '#22292f' : '#fff', borderColor: Colors[colorScheme ?? 'light'].border, marginBottom: 8 }}>
                {projects.map(project => {
                  const projectTasks = tasks.filter(task => task.projectId === project.id);
                  if (projectTasks.length === 0) return null;
                  return (
                    <View key={project.id} style={{ marginVertical: 8 }}>
                      {/* Project Card - subtle left border, slight tint */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 0, backgroundColor: project.color + '12', borderLeftWidth: 4, borderLeftColor: project.color }}>
                        <ThemedText style={{ fontSize: 15, fontWeight: '700', flex: 1, color: Colors[colorScheme ?? 'light'].text }}>{project.name}</ThemedText>
                      </View>
                      {/* Tasks List - indented, modal-matching bg, less green selection */}
                      <View style={{ marginLeft: 18, marginTop: 0 }}>
                        {projectTasks.map(task => (
                          <TouchableOpacity
                            key={task.id}
                            style={[{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: 5,
                              paddingHorizontal: 8,
                              borderRadius: 6,
                              marginVertical: 2,
                              backgroundColor: colorScheme === 'dark' ? '#22292f' : '#fff',
                              borderWidth: editTaskId === task.id ? 1 : 0,
                              borderColor: editTaskId === task.id ? (task.color || project.color) : 'transparent',
                            }]}
                            onPress={() => setEditTaskId(task.id)}
                          >
                            <TaskColorIndicator projectColor={project.color} taskColor={task.color} size={10} />
                            <ThemedText style={[{
                              flex: 1,
                              fontSize: 12,
                              marginLeft: 8,
                              color: editTaskId === task.id ? (task.color || project.color) : Colors[colorScheme ?? 'light'].text,
                              fontWeight: editTaskId === task.id ? 'bold' : 'normal',
                            }]}>{task.name}</ThemedText>
                            {editTaskId === task.id && (
                              <IconSymbol name="check-circle" size={12} color={task.color || project.color} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 13, fontWeight: '500', marginBottom: 2 }}>Start:</ThemedText>
                  <TouchableOpacity
                    style={[{ height: 36, borderColor: '#4CAF50', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, justifyContent: 'center', marginBottom: 0 }]}
                    onPress={() => {
                      setShowStartPicker(true);
                      setStartPickerMode('date');
                    }}
                  >
                    <ThemedText style={{ fontSize: 14 }}>{editStartDate.toLocaleString()}</ThemedText>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 13, fontWeight: '500', marginBottom: 2 }}>End:</ThemedText>
                  <TouchableOpacity
                    style={[{ height: 36, borderColor: '#4CAF50', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, justifyContent: 'center', marginBottom: 0 }]}
                    onPress={() => {
                      setShowEndPicker(true);
                      setEndPickerMode('date');
                    }}
                  >
                    <ThemedText style={{ fontSize: 14 }}>{editEndDate.toLocaleString()}</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, marginTop: 8, alignSelf: 'flex-end', backgroundColor: '#4CAF50', width: '100%' }]}
                onPress={handleEditSubmit}
              >
                <IconSymbol name="play-arrow" size={18} color="white" />
                <ThemedText style={{ color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>Save Changes</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
      {showStartPicker && (
        <DateTimePicker
          value={editStartDate}
          mode={startPickerMode}
          display="default"
          onChange={handleStartDateChange}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={editEndDate}
          mode={endPickerMode}
          display="default"
          onChange={handleEndDateChange}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalCardCompact: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  weekNavButton: {
    padding: 8,
  },
  weekInfo: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minWidth: 200,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekTotal: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
    minWidth: 40,
  },
  weekNavButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugButton: {
    padding: 8,
  },
  daysContainer: {
    backgroundColor: '#F8F9FA',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  todayRow: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  selectedDayRow: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#666666',
  },
  hasEntriesRow: {
    backgroundColor: '#E8F5E8',
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  todayText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  dayStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayHours: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  projectIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dayProjectIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 1,
  },
  moreIndicator: {
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.7,
  },
  selectedDayContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  entriesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  entryDetails: {
    flex: 1,
    marginLeft: 12,
  },
  entryTaskName: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryProjectName: {
    fontSize: 14,
    opacity: 0.7,
  },
  entryDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryTime: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
  },
  entryTimeText: {
    fontSize: 16,
    opacity: 0.7,
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 15,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  noEntriesMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  noEntriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  noEntriesText: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  inspirationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 48,
  },
  waveHand: {
    fontSize: 48,
    marginBottom: 12,
  },
  inspirationText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 320,
  },
  inspirationContainerCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 0,
  },
  hourglass: {
    fontSize: 48,
    marginBottom: 12,
  },
  hourglassContainer: {
    width: 48,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  hgTriangle: {
    position: 'absolute',
    left: 4,
    width: 40,
    height: 28,
    zIndex: 1,
  },
  hgTopTriangle: {
    top: 8,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#888',
    backgroundColor: 'transparent',
  },
  hgBottomTriangle: {
    top: 44,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderTopWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#888',
    backgroundColor: 'transparent',
  },
  hgSandTriangle: {
    position: 'absolute',
    left: 8,
    width: 32,
    zIndex: 2,
  },
  hgTopSand: {
    top: 12,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F4C542',
    backgroundColor: 'transparent',
  },
  hgBottomSand: {
    top: 48,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderTopWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F4C542',
    backgroundColor: 'transparent',
  },
  hgFallingSandDot: {
    position: 'absolute',
    left: 22,
    width: 4,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#F4C542',
    zIndex: 3,
  },
  entryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  taskList: {
    maxHeight: 200,
    borderRadius: 8,
    borderWidth: 1,
  },
  projectSection: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 2,
  },
  taskItemSelected: {
    borderWidth: 1,
  },
  taskName: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
  },
  taskNameSelected: {
    fontWeight: 'bold',
  },
  timeInputContainer: {
    marginBottom: 15,
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  timeInput: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  timeInputValue: {
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 