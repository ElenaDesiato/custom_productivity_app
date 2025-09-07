import { TaskColorIndicator } from '@/components/TaskColorIndicator';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTimeTrackingStore } from '@/stores/timeTrackingStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';

import React, { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TimerScreen() {
  // Subscribe directly to elapsedSeconds and isRunning for real-time updates
  const elapsedSeconds = useTimeTrackingStore(s => s.timerState.elapsedSeconds);
  const isRunning = useTimeTrackingStore(s => s.timerState.isRunning);

  // Ensure ticking interval is running when timer screen is loaded
  React.useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      // Increment elapsedSeconds in the store
      useTimeTrackingStore.setState(state => {
        if (!state.timerState.isRunning) return {};
        return {
          timerState: {
            ...state.timerState,
            elapsedSeconds: (state.timerState.elapsedSeconds || 0) + 1,
          },
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const colorScheme = useColorScheme();
  const projects = useTimeTrackingStore(s => s.projects);
  const tasks = useTimeTrackingStore(s => s.tasks);
  const startTimer = useTimeTrackingStore(s => s.startTimer);
  const startTimerWithCustomTime = useTimeTrackingStore(s => s.startTimerWithCustomTime);
  const stopTimer = useTimeTrackingStore(s => s.stopTimer);
  const pauseTimer = useTimeTrackingStore(s => s.pauseTimer);
  const resumeTimer = useTimeTrackingStore(s => s.resumeTimer);
  const getCurrentTask = useTimeTrackingStore(s => s.getCurrentTask);
  const formatTime = useTimeTrackingStore(s => s.formatTime);
  const addTimeEntry = useTimeTrackingStore(s => s.addTimeEntry);
  const loadData = useTimeTrackingStore(s => s.loadData);

  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startPickerMode, setStartPickerMode] = useState<'date' | 'time'>('date');
  const [endPickerMode, setEndPickerMode] = useState<'date' | 'time'>('date');
  const [startNow, setStartNow] = useState(false);
  const [continueRunning, setContinueRunning] = useState(false);
  const currentTask = getCurrentTask();

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (!showManualModal) {
        loadData();
      }
    }, [loadData, showManualModal])
  );

  const handleStartTimer = () => {
    if (tasks.length === 0) {
      Alert.alert('No Tasks', 'Please create a task first before starting the timer.');
      return;
    }
    // Set default dates when opening modal
    const now = new Date();
    setStartDate(now);
    setEndDate(new Date(now.getTime() + 3600000)); // 1 hour later
    setShowManualModal(true);
  setStartNow(false);
  setContinueRunning(false);
  };

  const handleManualEntrySubmit = async () => {
    if (!selectedTaskId) {
      Alert.alert('Missing Task', 'Please select a task for this time entry.');
      return;
    }

    try {
      if (!continueRunning && !startNow && endDate <= startDate) {
        Alert.alert('Invalid Time Range', 'End time must be after start time.');
        return;
      }

      if (startNow) {
        // Start timer now
        await startTimer(selectedTaskId);
      } else if (continueRunning) {
        // Start timer at selected start time, running (ticks up every second)
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startDate.getTime()) / 1000);
        await startTimerWithCustomTime(selectedTaskId, startDate, elapsedSeconds);
      } else {
        // For completed entries, use the selected end date
        const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
        await addTimeEntry(selectedTaskId, startDate, endDate, duration, false);
      }

      // Reset form
      handleCloseModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to add time entry. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowManualModal(false);
    setSelectedTaskId('');
    // Reset dates to current time
    setStartDate(new Date());
    setEndDate(new Date());
    setStartNow(false);
    setShowStartPicker(false);
    setShowEndPicker(false);
    setStartPickerMode('date');
    setEndPickerMode('date');
  };

  const handleStartDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (selectedDate) {
      if (startPickerMode === 'date') {
        // First step: date selected, now show time picker
        // Store the selected date and show time picker
        setStartDate(selectedDate);
        setStartPickerMode('time');
        setShowStartPicker(true);
      } else {
        // Second step: time selected, close picker
        // Create a new date combining the stored date with selected time
        const dateOnly = new Date(startDate);
        const timeOnly = new Date(selectedDate);
        
        const combinedDate = new Date(
          dateOnly.getFullYear(),
          dateOnly.getMonth(),
          dateOnly.getDate(),
          timeOnly.getHours(),
          timeOnly.getMinutes(),
          0,
          0
        );
        
        setStartDate(combinedDate);
        setShowStartPicker(false);
        setStartPickerMode('date'); // Reset for next time
      }
    } else {
      // User cancelled, close picker
      setShowStartPicker(false);
      setStartPickerMode('date');
    }
  }, [startPickerMode, startDate]);

  const handleEndDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (selectedDate) {
      if (endPickerMode === 'date') {
        // First step: date selected, now show time picker
        // Store the selected date and show time picker
        setEndDate(selectedDate);
        setEndPickerMode('time');
        setShowEndPicker(true);
      } else {
        // Second step: time selected, close picker
        // Create a new date combining the stored date with selected time
        const dateOnly = new Date(endDate);
        const timeOnly = new Date(selectedDate);
        
        const combinedDate = new Date(
          dateOnly.getFullYear(),
          dateOnly.getMonth(),
          dateOnly.getDate(),
          timeOnly.getHours(),
          timeOnly.getMinutes(),
          0,
          0
        );
        
        setEndDate(combinedDate);
        setShowEndPicker(false);
        setEndPickerMode('date'); // Reset for next time
      }
    } else {
      // User cancelled, close picker
      setShowEndPicker(false);
      setEndPickerMode('date');
    }
  }, [endPickerMode, endDate]);

  const handleStopTimer = () => {
    stopTimer();
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#808080';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  return (
    <ThemedView style={styles.container}>
      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <ThemedText style={styles.timerText}>
          {formatTime(elapsedSeconds)}
        </ThemedText>
        {currentTask && (
          <View style={styles.currentTaskContainer}>
            <TaskColorIndicator
              projectColor={currentTask.project?.color || '#808080'}
              taskColor={currentTask.task.color}
              size={16}
            />
            <ThemedText style={styles.currentTaskText}>
              {currentTask.task.name}
            </ThemedText>
            <ThemedText style={styles.currentProjectText}>
              {currentTask.project?.name}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isRunning ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartTimer}
          >
            <IconSymbol name="play-arrow" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Start Timer</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStopTimer}
          >
            <IconSymbol name="stop" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Stop</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <ScrollView
            contentContainerStyle={{ minHeight: '100%', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}
            style={{ width: '100%' }}
          >
            <View style={[styles.modalCardCompact, { backgroundColor: colorScheme === 'dark' ? '#22292f' : '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, borderRadius: 16, maxWidth: 420, width: '96%' }] }>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'left' }}>Start Timer</ThemedText>
                <TouchableOpacity onPress={handleCloseModal} style={{ padding: 4 }}>
                  <IconSymbol name="close" size={24} color={colorScheme === 'dark' ? '#fff' : '#22292f'} />
                </TouchableOpacity>
              </View>
              <View style={{ height: 1, backgroundColor: '#fff', opacity: 0.7, marginBottom: 16 }} />
              {/* New Project/Task Picker */}
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
                      {/* Tasks List - indented, modal-matching bg */}
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
                              borderWidth: selectedTaskId === task.id ? 1 : 0,
                              borderColor: selectedTaskId === task.id ? (task.color || project.color) : 'transparent',
                            }]}
                            onPress={() => setSelectedTaskId(task.id)}
                          >
                            <TaskColorIndicator projectColor={project.color} taskColor={task.color} size={10} />
                            <ThemedText style={[{
                              flex: 1,
                              fontSize: 12,
                              marginLeft: 8,
                              color: selectedTaskId === task.id ? (task.color || project.color) : Colors[colorScheme ?? 'light'].text,
                              fontWeight: selectedTaskId === task.id ? 'bold' : 'normal',
                            }]}>{task.name}</ThemedText>
                            {selectedTaskId === task.id && (
                              <IconSymbol name="check-circle" size={12} color={task.color || project.color} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              {/* Timer Options and Inputs */}
              <View style={styles.optionsRowCompact}>
                <TouchableOpacity
                  style={styles.checkboxContainerCompact}
                  onPress={() => {
                    // Toggle Start Now independently
                    if (startNow) {
                      setStartNow(false);
                    } else {
                      setStartNow(true);
                      setContinueRunning(true); // auto-check continue running when start now is checked
                    }
                  }}
                >
                  <View style={[styles.checkboxCompact, startNow && styles.checkboxCheckedCompact]}>
                    {startNow && <IconSymbol name="check" size={14} color="white" />}
                  </View>
                  <ThemedText style={styles.checkboxLabelCompact}>Start Now</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.checkboxContainerCompact}
                  onPress={() => {
                    // Toggle Continue Running independently
                    if (continueRunning) {
                      setContinueRunning(false);
                      if (startNow) setStartNow(false);
                    } else {
                      setContinueRunning(true);
                    }
                  }}
                >
                  <View style={[styles.checkboxCompact, continueRunning && styles.checkboxCheckedCompact]}>
                    {continueRunning && <IconSymbol name="check" size={14} color="white" />}
                  </View>
                  <ThemedText style={styles.checkboxLabelCompact}>Continue Running</ThemedText>
                </TouchableOpacity>
              </View>
              {!startNow && (
                <View style={styles.timePickersRowCompact}>
                  <View className={"timePickerCompact"}>
                    <ThemedText style={styles.formLabelCompact}>Start:</ThemedText>
                    <TouchableOpacity
                      style={[styles.textInputCompact, { borderColor: "#4CAF50" }]}
                      onPress={() => {
                        setStartPickerMode('date');
                        setShowStartPicker(true);
                      }}
                      disabled={startNow}
                    >
                      <ThemedText style={styles.textInputValueCompact}>{startDate.toLocaleString()}</ThemedText>
                    </TouchableOpacity>
                  </View>
                  {!continueRunning && (
                    <View style={styles.timePickerCompact}>
                      <ThemedText style={styles.formLabelCompact}>End:</ThemedText>
                      <TouchableOpacity
                        style={[styles.textInputCompact, { borderColor: "#4CAF50" }]}
                        onPress={() => {
                          setEndPickerMode('date');
                          setShowEndPicker(true);
                        }}
                        disabled={startNow || continueRunning}
                      >
                        <ThemedText style={styles.textInputValueCompact}>{endDate.toLocaleString()}</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              <TouchableOpacity
                style={[styles.buttonCompact, styles.startButtonCompact, styles.fullWidthButtonCompact]}
                onPress={handleManualEntrySubmit}
              >
                <IconSymbol name="play-arrow" size={18} color="white" />
                <ThemedText style={styles.buttonTextCompact}>
                  {startNow ? 'Start Timer' : (isRunning ? 'Add Time Entry' : 'Add Time Entry')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Date/Time Pickers */}
       {showStartPicker && (
         <DateTimePicker
           value={startDate}
           mode={startPickerMode}
           display="default"
           onChange={handleStartDateChange}
           maximumDate={new Date()}
         />
       )}
       
       {showEndPicker && (
         <DateTimePicker
           value={endDate}
           mode={endPickerMode}
           display="default"
           onChange={handleEndDateChange}
           maximumDate={new Date()}
         />
       )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  modalCardCompact: {
    backgroundColor: '#fff',
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
  fullWidthButtonCompact: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 12,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    lineHeight: 70,
  },
  currentTaskContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  projectIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  currentTaskText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
    minWidth: 0,
    width: '100%',
  },
  currentProjectText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    flexShrink: 1,
    minWidth: 0,
    width: '100%',
  },
  controlsContainer: {
    paddingBottom: 10,
    marginTop: -20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginVertical: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  projectSection: {
    marginVertical: 16,
    marginBottom: 20,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
  },
  projectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  taskName: {
    fontSize: 16,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  manualEntryForm: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedTaskName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  textInput: {
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
    justifyContent: 'center', // Center text for touchable area
  },
  textInputValue: {
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  startButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  manualButton: {
    backgroundColor: '#607D8B',
    marginTop: 10,
  },
  runningOption: {
    marginVertical: 15,
    width: '100%',
  },
     checkboxContainer: {
     flexDirection: 'row',
     alignItems: 'flex-start',
     width: '100%',
   },
   checkbox: {
     width: 20,
     height: 20,
     borderWidth: 2,
     borderColor: '#E0E0E0',
     borderRadius: 4,
     marginRight: 10,
     marginTop: 2,
     justifyContent: 'center',
     alignItems: 'center',
     flexShrink: 0,
   },
   checkboxChecked: {
     backgroundColor: '#4CAF50',
     borderColor: '#4CAF50',
   },
   checkboxLabel: {
     fontSize: 16,
     flex: 1,
     flexWrap: 'wrap',
   },
   startNowOption: {
     marginVertical: 15,
     width: '100%',
   },
  manualEntryFormCompact: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 8,
  },
  formLabelCompact: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  selectedTaskNameCompact: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionsRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },
  checkboxContainerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxCompact: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCheckedCompact: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxLabelCompact: {
    fontSize: 13,
    fontWeight: '400',
  },
  timePickersRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  timePickerCompact: {
    flex: 1,
  },
  textInputCompact: {
    height: 36,
    minWidth: 180,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginBottom: 0,
    fontSize: 14,
    justifyContent: 'center',
  },
  textInputValueCompact: {
    fontSize: 14,
  },
  buttonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  startButtonCompact: {
    backgroundColor: '#4CAF50',
  },
  buttonTextCompact: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  taskListListLike: {
    flex: 1,
    paddingHorizontal: 10,
  },
  projectSectionListLike: {
    marginVertical: 6,
  },
  projectHeaderListLike: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginVertical: 2,
  },
  projectDotListLike: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  projectNameListLike: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  taskItemListLike: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingLeft: 28,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    backgroundColor: 'transparent',
    marginVertical: 0,
    borderRadius: 0,
  },
  taskItemSelectedListLike: {
    backgroundColor: '#F7FAFC', // lighter, more subtle
    borderLeftWidth: 2,
    borderLeftColor: '#B3D4FC', // softer blue
    // Optionally, add a soft shadow for subtlety
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  taskNameListLike: {
    fontSize: 15,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
    marginLeft: 12,
  },
}); 