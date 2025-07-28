import { BarChart } from '@/components/BarChart';
import { PieChart } from '@/components/PieChart';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

type ReportPeriod = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom';
type ReportType = 'by-project' | 'by-task' | 'by-day';

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const { timeEntries, getTaskById, getProjectById, loadData } = useTimeTracking();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('this-week');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('by-project');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case 'this-week':
        // Calculate the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        // We want weeks to start on Monday, so treat Sunday (0) as 7
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'last-week':
        // Calculate the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        // We want weeks to start on Monday, so treat Sunday (0) as 7
        const lastWeekDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - lastWeekDayOfWeek + 1 - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'this-month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'last-month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      
      default:
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Filter time entries for selected period
  const filteredEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      const entryStart = new Date(entry.startTime);
      const entryEnd = entry.endTime ? new Date(entry.endTime) : null;

      // Entry starts within the period
      const startsInPeriod = entryStart >= dateRange.startDate && entryStart <= dateRange.endDate;
      // Entry ends within the period
      const endsInPeriod = entryEnd && entryEnd >= dateRange.startDate && entryEnd <= dateRange.endDate;
      // Entry spans the whole period (starts before and ends after)
      const spansPeriod = entryEnd && entryStart < dateRange.startDate && entryEnd > dateRange.endDate;
      // Entry is running or paused and started within the period (no end time yet)
      const isActiveInPeriod = (entry.isRunning || entry.isPaused) && startsInPeriod;

      return startsInPeriod || endsInPeriod || spansPeriod || isActiveInPeriod;
    });
  }, [timeEntries, dateRange]);

  // Calculate report data
  const reportData = useMemo(() => {
    const totalSeconds = filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalHours = totalSeconds / 3600;

    // Group by task
    const byTask: { [taskId: string]: any } = {};
    filteredEntries.forEach(entry => {
      const task = getTaskById(entry.taskId);
      const project = task ? getProjectById(task.projectId) : null;
      
      if (task) {
        if (!byTask[task.id]) {
          byTask[task.id] = {
            taskId: task.id,
            taskName: task.name,
            projectName: project?.name || 'Unknown Project',
            projectColor: project?.color || '#808080',
            seconds: 0,
          };
        }
        byTask[task.id].seconds += entry.duration || 0;
      }
    });

    // Group by project
    const byProject: { [projectId: string]: any } = {};
    filteredEntries.forEach(entry => {
      const task = getTaskById(entry.taskId);
      const project = task ? getProjectById(task.projectId) : null;
      
      if (project) {
        if (!byProject[project.id]) {
          byProject[project.id] = {
            projectId: project.id,
            projectName: project.name,
            projectColor: project.color,
            seconds: 0,
          };
        }
        byProject[project.id].seconds += entry.duration || 0;
      }
    });

    // Convert to arrays and calculate percentages
    const taskArray = Object.values(byTask).map(task => ({
      ...task,
      hours: task.seconds / 3600,
      percentage: totalHours > 0 ? (task.seconds / 3600 / totalHours) * 100 : 0,
    })).sort((a, b) => b.seconds - a.seconds);

    const projectArray = Object.values(byProject).map(project => ({
      ...project,
      hours: project.seconds / 3600,
      percentage: totalHours > 0 ? (project.seconds / 3600 / totalHours) * 100 : 0,
    })).sort((a, b) => b.seconds - a.seconds);

    return {
      totalHours,
      totalEntries: filteredEntries.length,
      byTask: taskArray,
      byProject: projectArray,
    };
  }, [filteredEntries, getTaskById, getProjectById]);

  // Generate a consistent color for a task based on its name
  const getTaskColor = (taskName: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    const hash = taskName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Prepare data for pie charts
  const pieChartData = useMemo(() => {
    if (selectedReportType === 'by-project') {
      return reportData.byProject.map(project => ({
        label: project.projectName,
        value: project.seconds,
        color: project.projectColor,
        percentage: project.percentage,
      }));
    } else if (selectedReportType === 'by-task') {
      return reportData.byTask.map(task => ({
        label: task.taskName,
        value: task.seconds,
        color: getTaskColor(task.taskName),
        percentage: task.percentage,
      }));
    }
    return [];
  }, [selectedReportType, reportData, getTaskColor]);

  // Prepare data for bar chart (by day)
  const barChartData = useMemo(() => {
    if (selectedReportType === 'by-day') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayData = days.map((day, index) => {
        // Calculate total hours for each day in the selected period
        const dayStart = new Date(dateRange.startDate);
        dayStart.setDate(dateRange.startDate.getDate() + index);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayEntries = filteredEntries.filter(entry => {
          const entryStart = new Date(entry.startTime);
          const entryEnd = entry.endTime ? new Date(entry.endTime) : new Date();
          return entryStart <= dayEnd && entryEnd >= dayStart;
        });
        
        const totalHours = dayEntries.reduce((total, entry) => {
          return total + (entry.duration || 0);
        }, 0) / 3600;
        
        return {
          label: day,
          value: totalHours,
          color: totalHours > 0 ? '#4CAF50' : '#E0E0E0',
          maxValue: Math.max(...days.map((_, i) => {
            const dStart = new Date(dateRange.startDate);
            dStart.setDate(dateRange.startDate.getDate() + i);
            dStart.setHours(0, 0, 0, 0);
            const dEnd = new Date(dStart);
            dEnd.setHours(23, 59, 59, 999);
            const dEntries = filteredEntries.filter(entry => {
              const entryStart = new Date(entry.startTime);
              const entryEnd = entry.endTime ? new Date(entry.endTime) : new Date();
              return entryStart <= dEnd && entryEnd >= dStart;
            });
            return dEntries.reduce((total, entry) => total + (entry.duration || 0), 0) / 3600;
          })),
        };
      });
      
      return dayData;
    }
    return [];
  }, [selectedReportType, filteredEntries, dateRange]);

  // Format date range for display
  const formatDateRange = () => {
    const start = dateRange.startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const end = dateRange.endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    return `${start} - ${end}`;
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Handle custom date selection
  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate) {
      setShowCustomModal(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <View style={[styles.periodButtons, { backgroundColor: Colors[colorScheme ?? 'light'].textSecondary }]}>
            {[
              { key: 'this-week', label: 'This Week' },
              { key: 'last-week', label: 'Last Week' },
              { key: 'this-month', label: 'This Month' },
              { key: 'last-month', label: 'Last Month' },
              { key: 'custom', label: 'Custom' },
            ].map(period => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && [styles.selectedPeriodButton, { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    shadowColor: Colors[colorScheme ?? 'light'].text 
                  }],
                ]}
                onPress={() => {
                  setSelectedPeriod(period.key as ReportPeriod);
                  if (period.key === 'custom') {
                    setShowCustomModal(true);
                  }
                }}
              >
                <ThemedText type="secondary" style={[
                  styles.periodButtonText,
                  { color: Colors[colorScheme ?? 'light'].text },
                  selectedPeriod === period.key && [styles.selectedPeriodButtonText, { 
                    color: Colors[colorScheme ?? 'light'].tint 
                  }],
                ]}>
                  {period.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          <ThemedText style={styles.dateRange}>{formatDateRange()}</ThemedText>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <ThemedText type="secondary" style={styles.summaryValue}>
              {reportData.totalHours.toFixed(1)}h
            </ThemedText>
            <ThemedText type="secondary" style={styles.summaryLabel}>Total Time</ThemedText>
          </View>
          
          <View style={styles.summaryCard}>
            <ThemedText type="secondary" style={styles.summaryValue}>
              {reportData.byTask.length}
            </ThemedText>
            <ThemedText type="secondary" style={styles.summaryLabel}>Tasks</ThemedText>
          </View>
          
          <View style={styles.summaryCard}>
            <ThemedText type="secondary" style={styles.summaryValue}>
              {reportData.byProject.length}
            </ThemedText>
            <ThemedText type="secondary" style={styles.summaryLabel}>Projects</ThemedText>
          </View>
        </View>

        {/* Report Type Selector */}
        <View style={styles.periodSelector}>
          <View style={[styles.periodButtons, { backgroundColor: Colors[colorScheme ?? 'light'].textSecondary }]}>
            {[
              { key: 'by-project', label: 'By Project' },
              { key: 'by-task', label: 'By Task' },
              { key: 'by-day', label: 'By Day' },
            ].map((reportType) => (
              <TouchableOpacity
                key={reportType.key}
                style={[
                  styles.periodButton,
                  selectedReportType === reportType.key && [styles.selectedPeriodButton, { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    shadowColor: Colors[colorScheme ?? 'light'].text 
                  }],
                ]}
                onPress={() => setSelectedReportType(reportType.key as ReportType)}
              >
                <ThemedText type="secondary" style={[
                  styles.periodButtonText,
                  { color: Colors[colorScheme ?? 'light'].text },
                  selectedReportType === reportType.key && [styles.selectedPeriodButtonText, { 
                    color: Colors[colorScheme ?? 'light'].tint 
                  }],
                ]}>
                  {reportType.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Report Content */}
        {selectedReportType === 'by-project' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>By Project</ThemedText>
            {/* Pie Chart */}
            <View style={[styles.chartContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
              <PieChart data={pieChartData} size={200} />
            </View>
            {reportData.byProject.map((project, index) => (
            <View key={project.projectId} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <View style={[
                    styles.projectIndicator,
                    { backgroundColor: project.projectColor }
                  ]} />
                  <View style={styles.itemDetails}>
                    <ThemedText type="secondary" style={styles.itemName}>{project.projectName}</ThemedText>
                    <ThemedText type="secondary" style={styles.itemPercentage}>
                      {project.percentage.toFixed(1)}%
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="secondary" style={styles.itemDuration}>
                  {formatDuration(project.seconds)}
                </ThemedText>
              </View>
              
              {/* Progress bar */}
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${project.percentage}%`,
                      backgroundColor: project.projectColor,
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>

        )}

        {selectedReportType === 'by-task' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>By Task</ThemedText>
            {/* Pie Chart */}
            <View style={[styles.chartContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
              <PieChart data={pieChartData} size={200} />
            </View>
            {reportData.byTask.map((task, index) => (
              <View key={task.taskId} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <View style={styles.splitCircleContainer}>
                      <View style={[styles.splitCircleHalf, { backgroundColor: task.projectColor }]} />
                      <View style={[styles.splitCircleHalf, { backgroundColor: getTaskColor(task.taskName) }]} />
                    </View>
                    <View style={styles.itemDetails}>
                      <ThemedText type="secondary" style={styles.itemName}>{task.taskName}</ThemedText>
                      <ThemedText type="secondary" style={styles.itemSubtext}>{task.projectName}</ThemedText>
                      <ThemedText type="secondary" style={styles.itemPercentage}>
                        {task.percentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText type="secondary" style={styles.itemDuration}>
                    {formatDuration(task.seconds)}
                  </ThemedText>
                </View>
                
                {/* Progress bar */}
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${task.percentage}%`,
                        backgroundColor: task.projectColor,
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedReportType === 'by-day' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>By Day</ThemedText>
            {/* Bar Chart */}
            <View style={[styles.chartContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
              <BarChart data={barChartData} height={200} />
            </View>
          </View>
        )}

        {filteredEntries.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="insert-chart" size={48} color={Colors[colorScheme ?? 'light'].text} />
            <ThemedText style={styles.emptyTitle}>No Data</ThemedText>
            <ThemedText style={styles.emptyText}>
              No time entries found for the selected period.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Custom Date Modal */}
      <Modal
        visible={showCustomModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Custom Date Range</ThemedText>
            <TouchableOpacity
              onPress={() => setShowCustomModal(false)}
              style={styles.closeButton}
            >
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.dateInputContainer}>
              <ThemedText type="secondary" style={[styles.dateLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Start Date</ThemedText>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartPicker(true)}
              >
                <ThemedText style={styles.dateInputText}>
                  {customStartDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <ThemedText type="secondary" style={[styles.dateLabel, { color: Colors[colorScheme ?? 'light'].text }]}>End Date</ThemedText>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndPicker(true)}
              >
                <ThemedText style={styles.dateInputText}>
                  {customEndDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleCustomDateSubmit}
            >
              <ThemedText style={styles.saveButtonText}>Apply Date Range</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Modal>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={customStartDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setCustomStartDate(selectedDate);
            }
          }}
        />
      )}
      
      {showEndPicker && (
        <DateTimePicker
          value={customEndDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) {
              setCustomEndDate(selectedDate);
            }
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingHorizontal: 12,
  },
  periodSelector: {
    marginBottom: 12,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderRadius: 25,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
    flex: 1,
    marginHorizontal: 1,
  },
  selectedPeriodButton: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedPeriodButtonText: {
    fontWeight: '600',
  },
  dateRange: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    paddingHorizontal: 16,
    marginHorizontal: 3,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    minWidth: 0,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
    width: '100%',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  itemCard: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemSubtext: {
    fontSize: 12,
    opacity: 0.7,
  },
  itemPercentage: {
    fontSize: 11,
    opacity: 0.7,
  },
  itemDuration: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#E0E0E0',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
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
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  dateInputContainer: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  dateInputText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  splitCircleContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    flexDirection: 'row',
  },
  splitCircleHalf: {
    width: '50%',
    height: '100%',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  chartPlaceholder: {
    fontSize: 16,
    opacity: 0.7,
  },
}); 