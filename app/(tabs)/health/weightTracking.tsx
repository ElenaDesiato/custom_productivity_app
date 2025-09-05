import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { loadWeightEntries, saveWeightEntries } from '@/stores/weightStore';
import { Alert } from 'react-native';
import { G, Line as SvgLine, Text as SvgText } from 'react-native-svg';

import { cancelWeightReminders, requestNotificationPermission, scheduleDailyWeightReminder } from '@/utils/weightNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

// Simple type for a weight entry
export type WeightEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number;
};

export default function WeightTrackingScreen() {
  // Helper to generate random weights for the past 4 months
  function generateSampleWeights(startWeight = 70, days = 365) {
    const today = new Date();
    const entries = [];
    let weight = startWeight;
    // Add a slow trend and larger daily fluctuation for more spread
    const trend = (Math.random() - 0.5) * 6; // up to ±3kg over 4 months
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      // Simulate larger daily weight fluctuation and a slow trend
      weight += (Math.random() - 0.5) * 1.2; // daily fluctuation up to ±0.6kg
      // Add a slow trend component
      let sampleWeight = weight + (trend / days) * (days - i);
      // Clamp to 60-80kg
      sampleWeight = Math.max(60, Math.min(80, sampleWeight));
      entries.push({
        date: date.toISOString().slice(0, 10),
        weight: parseFloat(sampleWeight.toFixed(1)),
        id: `${date.getTime()}-sample`,
      });
    }
    return entries.reverse();
  }

  // Handler to fill sample weights
  const handleFillSampleWeights = async () => {
    const sampleEntries = generateSampleWeights(70, 365); // 1 year = 365 days
    try {
      await saveWeightEntries(sampleEntries);
      setEntries(sampleEntries);
      Alert.alert('Sample Data Added', 'Sample weights for the past 4 months have been added.');
    } catch (e) {
      Alert.alert('Error', 'Failed to add sample data.');
    }
  };
  const colorScheme = useColorScheme();
  const [weight, setWeight] = useState('');
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | '3months' | 'year' | 'all'>('month');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editWeight, setEditWeight] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime, setNotifTime] = useState<{hour: number, minute: number}>({ hour: 8, minute: 0 });

  // Keys for persistent reminder state
  const NOTIF_ENABLED_KEY = 'weight_reminder_enabled';
  const NOTIF_TIME_KEY = 'weight_reminder_time';
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load entries and reminder state from storage
  useEffect(() => {
    loadWeightEntries().then(setEntries);
    (async () => {
      const enabled = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
      const time = await AsyncStorage.getItem(NOTIF_TIME_KEY);
      let shouldEnable = false;
      let loadedTime = { hour: 8, minute: 0 };
      if (enabled !== null) {
        shouldEnable = enabled === 'true';
        setNotifEnabled(shouldEnable);
      }
      if (time) {
        try {
          const parsed = JSON.parse(time);
          if (typeof parsed.hour === 'number' && typeof parsed.minute === 'number') {
            loadedTime = parsed;
            setNotifTime(parsed);
          }
        } catch {}
      }
      // Always schedule/cancel notification based on loaded state
      if (shouldEnable) {
        await scheduleDailyWeightReminder(loadedTime.hour, loadedTime.minute);
      } else {
        await cancelWeightReminders();
      }
    })();
  }, []);

  // Persist entries
  useEffect(() => {
    saveWeightEntries(entries);
  }, [entries]);


  // Only allow one entry per day
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find(e => e.date === today);

  const handleAdd = () => {
    if (!weight) return;
    if (todayEntry) return; // already entered today
    setEntries([{ id: Date.now().toString(), date: today, weight: parseFloat(weight) }, ...entries]);
    setWeight('');
  };

  const handleEdit = (id: string, newWeight: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, weight: parseFloat(newWeight) } : e));
    setEditModalVisible(false);
    setEditId(null);
    setEditWeight('');
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    setEditModalVisible(false);
    setEditId(null);
    setEditWeight('');
  };

  // Filtering by calendar period
  const now = new Date();
  let filteredEntries = entries;
  if (filterPeriod === 'week') {
    // Last 7 days (including today)
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0,0,0,0);
    filteredEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= start && entryDate <= now;
    });
  } else if (filterPeriod === 'month') {
    // Last 30 days (including today)
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    start.setHours(0,0,0,0);
    filteredEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= start && entryDate <= now;
    });
  } else if (filterPeriod === '3months') {
    // Last 90 days (including today)
    const start = new Date(now);
    start.setDate(now.getDate() - 89);
    start.setHours(0,0,0,0);
    filteredEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= start && entryDate <= now;
    });
  } else if (filterPeriod === 'year') {
    // Since start of the calendar year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    filteredEntries = entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= startOfYear && entryDate <= now;
    });
  } else if (filterPeriod === 'all') {
    filteredEntries = entries;
  }

  // Chart data for react-native-chart-kit
  // For all plots, format x-axis labels as DD/MM
  const reversedEntries = [...filteredEntries].reverse();
  let chartLabels: string[] = [];
  if (filterPeriod === 'year' || filterPeriod === 'all') {
    // Only show the first day of each month
    chartLabels = reversedEntries.map((e, i, arr) => {
      const d = new Date(e.date);
      if (d.getDate() === 1) {
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      // Always show first and last
      if (i === 0 || i === arr.length - 1) {
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      return '';
    });
  } else if (filterPeriod === 'month' || filterPeriod === '3months') {
    // Show a few evenly spaced labels, all as DD/MM
    const labelCount = filterPeriod === 'month' ? 5 : 7;
    chartLabels = reversedEntries.map((e, i, arr) => {
      const d = new Date(e.date);
      if (i === 0 || i === arr.length - 1) {
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      const interval = Math.floor(arr.length / (labelCount - 1));
      if (interval > 0 && i % interval === 0) {
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      return '';
    });
  } else {
    // For week, show all as DD/MM
    chartLabels = reversedEntries.map(e => {
      const d = new Date(e.date);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }
  const chartWeights = reversedEntries.map(e => e.weight);

  // Notification logic
  const handleNotifToggle = async () => {
    if (!notifEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotifEnabled(true);
        await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
        await scheduleDailyWeightReminder(notifTime.hour, notifTime.minute);
      }
    } else {
      setNotifEnabled(false);
      await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
      await cancelWeightReminders();
    }
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    if (event?.type === 'set' && selectedDate) {
      const newTime = { hour: selectedDate.getHours(), minute: selectedDate.getMinutes() };
      setNotifTime(newTime);
      await AsyncStorage.setItem(NOTIF_TIME_KEY, JSON.stringify(newTime));
      if (notifEnabled) {
        await scheduleDailyWeightReminder(newTime.hour, newTime.minute);
      }
      setShowTimePicker(false);
    } else if (event?.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }] }>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="Enter weight (kg)"
          placeholderTextColor="#888"
          editable={!todayEntry}
        />
        <TouchableOpacity style={[styles.addButton, todayEntry && { opacity: 0.5 }]} onPress={handleAdd} disabled={!!todayEntry}>
          <IconSymbol name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {todayEntry && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <ThemedText style={{ color: '#888', marginRight: 8 }}>Today's entry: {todayEntry.weight} kg</ThemedText>
          <TouchableOpacity onPress={() => { setEditModalVisible(true); setEditId(todayEntry.id); setEditWeight(todayEntry.weight.toString()); }}>
            <IconSymbol name="edit" size={20} color="#BA68C8" />
          </TouchableOpacity>
          <View style={{ width: 24 }} />
          <TouchableOpacity onPress={() => handleDelete(todayEntry.id)}>
            <IconSymbol name="delete" size={20} color="#E57373" />
          </TouchableOpacity>
        </View>
      )}
      {/* Timeframe pill selector */}
      <View style={styles.periodSelector}>
        <View style={[styles.periodButtons, { backgroundColor: Colors[colorScheme ?? 'light'].textSecondary }]}> 
          {[
            { key: 'week', label: '1 Week' },
            { key: 'month', label: '1 Month' },
            { key: '3months', label: '3 Months' },
            { key: 'year', label: 'This Year' },
            { key: 'all', label: 'All'},
          ].map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                filterPeriod === period.key && [styles.selectedPeriodButton, { 
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  shadowColor: Colors[colorScheme ?? 'light'].text 
                }],
              ]}
              onPress={() => setFilterPeriod(period.key as 'week' | 'month' | '3months' | 'year')}
            >
              <ThemedText type="secondary" style={[
                styles.periodButtonText,
                { color: Colors[colorScheme ?? 'light'].text },
                filterPeriod === period.key && [styles.selectedPeriodButtonText, { 
                  color: Colors[colorScheme ?? 'light'].tint 
                }],
              ]}>
                {period.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Dot chart for weights in the selected time frame */}
      <View style={{ marginBottom: 8 }}>
        {chartWeights.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [
                  {
                    data: chartWeights,
                    color: () => '#7C3AAD',
                    strokeWidth: 0,
                    withDots: true,
                  },
                ],
              }}
              width={(() => {
                // px per point: week=40, month=20, 3months=12, year=8, all=6
                let pxPerPoint = 40;
                if (filterPeriod === 'month') pxPerPoint = 20;
                else if (filterPeriod === '3months') pxPerPoint = 12;
                else if (filterPeriod === 'year') pxPerPoint = 8;
                else if (filterPeriod === 'all') pxPerPoint = 6;
                return Math.max(Dimensions.get('window').width - 16, chartLabels.length * pxPerPoint);
              })()}
              height={180}
              yAxisSuffix=" kg"
              yLabelsOffset={8}
              yAxisInterval={1}
              fromZero={false}
              segments={(() => {
                // More segments for fine scale if range is small
                const min = Math.min(...chartWeights);
                const max = Math.max(...chartWeights);
                const range = max - min;
                if (range <= 2) return 8;
                if (range <= 5) return 6;
                return 4;
              })()}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 1,
                color: () => '#7C3AAD',
                labelColor: () => '#888',
                propsForDots: {
                  r:
                    filterPeriod === 'year' || filterPeriod === 'all'
                      ? '2'
                      : '3',
                  strokeWidth: '2',
                  stroke: '#7C3AAD',
                  fill: '#fff',
                },
                propsForBackgroundLines: {
                  stroke: '#eee',
                },
              }}
              withDots={true}
              withShadow={false}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              bezier={false}
              style={{ borderRadius: 12 }}
              decorator={filterPeriod === 'all' ? () => {
                // Mark the start of each year
                const yearIndices: { idx: number, year: number }[] = [];
                let lastYear: number | null = null;
                reversedEntries.forEach((e, i) => {
                  const d = new Date(e.date);
                  if (d.getMonth() === 0 && d.getDate() === 1 && d.getFullYear() !== lastYear) {
                    yearIndices.push({ idx: i, year: d.getFullYear() });
                    lastYear = d.getFullYear();
                  }
                });
                // SVG width and chart width are the same
                const chartW = Math.max(Dimensions.get('window').width - 16, chartLabels.length * 6);
                return (
                  <>
                    {yearIndices.map(({ idx, year }) => {
                      const x = (chartW / (chartLabels.length - 1)) * idx;
                      return (
                        <G key={year}>
                          <SvgLine x1={x} y1={0} x2={x} y2={180} stroke="#BA68C8" strokeDasharray="4 4" strokeWidth="1" />
                          <SvgText x={x + 2} y={14} fontSize="10" fill="#BA68C8">{year}</SvgText>
                        </G>
                      );
                    })}
                  </>
                );
              } : undefined}
            />
          </ScrollView>
        )}
      </View>
      <FlatList
        data={filteredEntries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          // Format date as 'DD.MM.YYYY'
          const d = new Date(item.date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          const formattedDate = `${day}.${month}.${year}`;
          return (
            <View style={styles.entryRow}>
              <ThemedText style={[styles.entryDate, { minWidth: 96 }]}>{formattedDate}</ThemedText>
              <ThemedText style={[styles.entryWeight, { color: Colors[colorScheme ?? 'light'].text }]}>{item.weight} kg</ThemedText>
              {item.date === today && (
                <TouchableOpacity onPress={() => { setEditModalVisible(true); setEditId(item.id); setEditWeight(item.weight.toString()); }}>
                  <IconSymbol name="edit" size={18} color="#BA68C8" />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<ThemedText style={styles.emptyText}>No entries yet.</ThemedText>}
        style={{ marginTop: 8 }}
      />
      <View style={{ marginTop: 16, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setShowReminderModal(true)} style={{ backgroundColor: '#7C3AAD', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 }}>
          <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Set Reminder</ThemedText>
        </TouchableOpacity>
      </View>
      {/* Reminder Modal */}
  <Modal visible={showReminderModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16, width: 340, elevation: 4 }}>
            {/* X close button in top-right */}
            <TouchableOpacity
              onPress={() => setShowReminderModal(false)}
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6 }}
              accessibilityLabel="Close reminder modal"
            >
              <IconSymbol name="close" size={22} color="#888" />
            </TouchableOpacity>
            <ThemedText style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center', color: '#000' }}>Daily Weight Reminder</ThemedText>
            <ThemedText style={{ color: '#555', marginBottom: 18, textAlign: 'center' }}>
              Enable this to receive a push notification each day at your chosen time, reminding you to log your weight. You can change the time or disable the reminder anytime.
            </ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <ThemedText style={{ fontSize: 16, marginRight: 10, color: '#000' }}>Reminder:</ThemedText>
              <TouchableOpacity
                onPress={handleNotifToggle}
                style={{
                  backgroundColor: notifEnabled ? '#7C3AAD' : '#eee',
                  borderRadius: 16,
                  paddingVertical: 6,
                  paddingHorizontal: 18,
                  marginRight: 10,
                }}
              >
                <ThemedText style={{ color: notifEnabled ? '#fff' : '#888', fontWeight: 'bold' }}>
                  {notifEnabled ? 'Enabled' : 'Disabled'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => notifEnabled && setShowTimePicker(true)}
                disabled={!notifEnabled}
                style={{
                  backgroundColor: notifEnabled ? '#EDE7F6' : '#f3f3f3',
                  borderRadius: 16,
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  opacity: notifEnabled ? 1 : 0.5,
                }}
              >
                <ThemedText style={{ color: '#7C3AAD', fontWeight: 'bold' }}>
                  {notifTime.hour.toString().padStart(2, '0')}:{notifTime.minute.toString().padStart(2, '0')}
                </ThemedText>
              </TouchableOpacity>
            </View>
            {showTimePicker && (
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <DateTimePicker
                  value={new Date(0, 0, 0, notifTime.hour, notifTime.minute)}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  style={{ width: 120 }}
                />
              </View>
            )}
            {/* No extra bottom margin */}
          </View>
        </View>
      </Modal>
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }] }>
            {/* ...existing modal content for editing weight... */}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    borderRadius: 16,
    width: 320,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#9C27B0', marginBottom: 16, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#9C27B0', borderRadius: 8, padding: 10, backgroundColor: '#fff', color: '#222' },
  addButton: { backgroundColor: '#9C27B0', borderRadius: 8, padding: 10, marginLeft: 8 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  entryDate: { color: '#888', fontSize: 15 },
  entryWeight: { color: '#222', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#aaa', fontStyle: 'italic', textAlign: 'center', marginTop: 32 },
  // Pills styles from time-tracking reports
  periodSelector: {
    marginBottom: 8,
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
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedPeriodButtonText: {
    fontWeight: '600',
  },
});
