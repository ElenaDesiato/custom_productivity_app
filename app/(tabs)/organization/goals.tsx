// Goals screen placeholder

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useGoals } from '@/hooks/useGoals';
import { useSelfCareAreas } from '@/hooks/useSelfCareAreas';
import { useUserSettings } from '@/hooks/useUserSettings';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Platform, StyleSheet as RNStyleSheet, StyleSheet, TouchableOpacity, View } from 'react-native';
import ConfettiView from 'react-native-confetti-view';
// DebugPanel for development/testing
type DebugPanelProps = {
  onUncompleteToday: () => void;
  onAdvanceDay: () => void;
  debugDayOffset: number;
};
function DebugPanel({ onUncompleteToday, onAdvanceDay, debugDayOffset }: DebugPanelProps) {
  const panelStyle = {
    backgroundColor: '#ffe0b2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ff9800',
  };
  return (
    <View style={panelStyle}>
      <ThemedText style={{ fontWeight: 'bold', color: '#e65100', marginBottom: 8 }}>DEBUG PANEL</ThemedText>
      <TouchableOpacity onPress={onUncompleteToday} style={{ marginBottom: 8, backgroundColor: '#fff3e0', borderRadius: 6, padding: 8 }}>
        <ThemedText style={{ color: '#e65100', fontWeight: 'bold' }}>Uncomplete A Goal</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAdvanceDay} style={{ backgroundColor: '#fff3e0', borderRadius: 6, padding: 8 }}>
        <ThemedText style={{ color: '#e65100', fontWeight: 'bold' }}>Advance Day (Current Offset: {debugDayOffset})</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';



import { useFocusEffect } from '@react-navigation/native';

function GoalsScreen() {
  // (No fade overlay state)
  const windowHeight = Dimensions.get('window').height;
  const windowWidth = Dimensions.get('window').width;
  const { goals, loading, addGoal, updateGoal, streak, reloadGoals } = useGoals();
  // Debug state: day offset for faking current day
  const [debugDayOffset, setDebugDayOffset] = useState(0);

  // Helper to get the debug/fake 'today' date
  function getDebugToday(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }
  // Helper to get ISO string for debug today
  const debugTodayDate = getDebugToday(debugDayOffset);
  const today = debugTodayDate.toISOString().slice(0, 10);
  // Make Monday=0, Sunday=6 to match rest of app, with debug offset
  const jsDay = debugTodayDate.getDay();
  const todayIdx = (jsDay === 0 ? 6 : jsDay - 1);

  // Handler to uncomplete all today's goals
  const handleUncompleteToday = useCallback(async () => {
    for (const goal of goals) {
      if (goal.completedDates?.includes(today)) {
        const updated = {
          ...goal,
          completedDates: goal.completedDates.filter(date => date !== today),
        };
        await updateGoal(updated);
      }
    }
    reloadGoals && reloadGoals();
  }, [goals, today, updateGoal, reloadGoals]);

  // Handler to advance the debug day
  const handleAdvanceDay = useCallback(() => {
    setDebugDayOffset(offset => offset + 1);
  }, []);
  // Toggle a single day in selectedDays
  function toggleDay(idx: number) {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
    );
  }

  // Toggle all days selection
  function toggleAllDays() {
    setSelectedDays(selectedDays.length === 7 ? [] : [0,1,2,3,4,5,6]);
  }
  // Reload goals when returning to this screen (after navigating back from settings)
  useFocusEffect(
    useCallback(() => {
      reloadGoals && reloadGoals();
    }, [reloadGoals])
  );
  const { areas } = useSelfCareAreas();
  const { settings: userSettings, loading: settingsLoading } = useUserSettings();
  const colorScheme = useColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const [modalVisible, setModalVisible] = useState(false);
  const [desc, setDesc] = useState('');
  const [areaId, setAreaId] = useState('');
  const [points, setPoints] = useState('5');
  // Days of week: 0=Mon, 1=Tue, ..., 6=Sun
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // Default: none selected
  const [goalColor, setGoalColor] = useState('#FFFFFF');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  // Self-care area icons are now assigned in useSelfCareAreas/DEFAULT_AREAS
  // Goal color options
  const colorOptions = [
    '#FFFFFF', // white
    '#FFD600', // yellow
    '#FBC02D', // gold
    '#FFB74D', // orange
    '#FF8A65', // light orange
    '#E57373', // red
    '#F06292', // pink
    '#F48FB1', // light pink
    '#BA68C8', // purple
    '#9575CD', // violet
    '#7E57C2', // deep purple
    '#7986CB', // indigo
    '#2196F3', // blue
    '#1976D2', // dark blue
    '#64B5F6', // light blue
    '#4FC3F7', // cyan
    '#4DD0E1', // teal
    '#81C784', // green
    '#A1887F', // brown
    '#8D6E63', // dark brown
    '#90A4AE', // gray
    '#000000', // black
  ];
  // Use dailyGoal from user settings if available
  const dailyGoal = userSettings?.dailyGoal || 20;

  // Track animating goals by id
  const [animatingGoalIds, setAnimatingGoalIds] = useState<string[]>([]);
  const [confettiGoalId, setConfettiGoalId] = useState<string|null>(null);
  const [confettiKey, setConfettiKey] = useState(0);

  const dailyPoints = useMemo(() =>
    goals.reduce((sum, goal) =>
      goal.completedDates?.includes(today) ? sum + goal.points : sum
    , 0), [goals, today]);

  const router = useRouter();
  // --- FlatList filter and empty logic ---
  const filteredGoals = [...goals]
    .filter(goal =>
      (!goal.repetitionDays || goal.repetitionDays.length === 0 || goal.repetitionDays.includes(todayIdx)) &&
      !(goal.completedDates?.includes(today))
    )
    .sort((a, b) => {
      const areaA = areas.find(area => area.id === a.areaId)?.name || '';
      const areaB = areas.find(area => area.id === b.areaId)?.name || '';
      return areaA.localeCompare(areaB);
    });
  const complete = dailyPoints >= dailyGoal;

  return (
    <ThemedView style={styles.container}>
      {/* Debug panel only in dev mode */}
      {__DEV__ && (
        <DebugPanel
          onUncompleteToday={handleUncompleteToday}
          onAdvanceDay={handleAdvanceDay}
          debugDayOffset={debugDayOffset}
        />
      )}
      {/* Streak Text */}
      <View style={{ marginTop: 8, marginBottom: 0, alignItems: 'center' }}>
        <ThemedText type="secondary" style={{
          fontSize: 16,
          fontWeight: '600',
          color: Colors[colorScheme].tint,
          marginBottom: 6,
          letterSpacing: 0.1,
        }}>
          {loading ? 'Loading streak...' : (() => {
            if (streak === 0) return 'Start your streak today!';
            if (streak === 1) return '🔥 1 day streak – great start!';
            if (streak < 5) return `🔥 ${streak} day streak – keep it going!`;
            if (streak < 10) return `🔥 ${streak} days! You’re on a roll!`;
            if (streak < 30) return `🔥 ${streak} days! Amazing consistency!`;
            if (streak < 100) return `🔥 ${streak} days! You’re unstoppable!`;
            return `🔥 ${streak} days! Legendary streak!`;
          })()}
        </ThemedText>
      </View>
      {/* Main Daily Progress Bar */}
      <View style={{ marginBottom: 16, alignItems: 'center' }}>
        {(() => {
          const complete = dailyPoints >= dailyGoal;
          return (
            <View style={{
              width: '96%',
              height: 44,
              backgroundColor: '#fff',
              borderRadius: 22,
              overflow: 'hidden',
              borderWidth: 3,
              borderColor: complete ? '#4CAF50' : '#2196F3',
              justifyContent: 'center',
              shadowColor: complete ? '#4CAF50' : '#2196F3',
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 4,
              position: 'relative',
            }}>
              <View style={{
                height: '100%',
                width: `${Math.min(100, (dailyPoints/dailyGoal)*100)}%`,
                backgroundColor: complete ? '#C8F7C5' : '#E3F2FD',
                borderRadius: 22,
                position: 'absolute',
                left: 0,
                top: 0,
              }} />
              <View style={{ position: 'absolute', width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                <ThemedText style={{ fontWeight: 'bold', color: complete ? '#388E3C' : '#1976D2', fontSize: 22, marginLeft: 18 }}>{dailyPoints} / {dailyGoal} pts</ThemedText>
                {complete && (
                  <IconSymbol name="check-circle" size={28} color="#4CAF50" style={{ marginRight: 18 }} />
                )}
              </View>
            </View>
          );
        })()}
      </View>

      {/* Weekly Area Goals Button */}
      <TouchableOpacity
        style={{
          marginBottom: 10,
          alignSelf: 'center',
          backgroundColor: '#2196F3',
          borderRadius: 18,
          paddingVertical: 8,
          paddingHorizontal: 22,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.10,
          shadowRadius: 4,
          elevation: 2,
        }}
        onPress={() => router.push('./weeklyGoals')}
        activeOpacity={0.8}
      >
        <IconSymbol name="bar-chart" size={20} color="#fff" style={{ marginRight: 8 }} />
        <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Weekly Self-Care Area Goals</ThemedText>
      </TouchableOpacity>

      {/* Goals Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('./goalsSettings')}
        activeOpacity={0.7}
      >
        <IconSymbol name="settings" size={22} color="#888" />
      </TouchableOpacity>

      {/* Goals List */}
      {confettiGoalId && (
        <View style={[RNStyleSheet.absoluteFillObject, { zIndex: 9999, pointerEvents: 'none' }]} pointerEvents="none">
          <ConfettiView
            key={confettiKey}
            confettiCount={50}
            duration={500}
            colors={[
              "#FFD700", "#FF69B4", "#4FC3F7", "#81C784", "#FF8A65",
              "#FF0000", "#00FF00", "#0000FF", "#FFA500", "#800080"
            ]}
            size={2.0}
            autoStart
            style={{ width: 0, height: 0 }}
          />
        </View>
      )}
  {/* No fade overlay */}
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filteredGoals}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={
            complete && filteredGoals.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 32 }}>
                <View style={{
                  marginBottom: 8,
                  borderRadius: 32,
                  backgroundColor: 'linear-gradient(135deg, #FFD600 60%, #FFA000 100%)',
                  padding: 8,
                  shadowColor: '#FFD600',
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 8,
                }}>
                  <FontAwesome name="trophy" size={54} color="#FFD700" style={{ textShadowColor: '#FFA000', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 6 }} />
                </View>
                <ThemedText style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#388E3C' }}>
                  Congratulations! You’ve completed all your goals for today and hit your daily target! 🎉
                </ThemedText>
                <ThemedText style={{ textAlign: 'center', marginTop: 8, color: '#888' }}>
                  Take a moment to celebrate your progress and enjoy some well-deserved rest.
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={{ textAlign: 'center', marginTop: 32 }}>
                No goals yet. Add your first goal in Goals Settings!
              </ThemedText>
            )
          }
          renderItem={({ item }) => {
            const area = areas.find(a => a.id === item.areaId);
            const areaColor = area?.color || '#4CAF50';
            const isCompleted = item.completedDates?.includes(today);
            const animating = animatingGoalIds.includes(item.id);
            const handleComplete = async () => {
              if (isCompleted || animating) return;
              setAnimatingGoalIds(ids => [...ids, item.id]);
              await updateGoal({ ...item, completedDates: [...(item.completedDates || []), today] });
              setConfettiGoalId(item.id);
              setConfettiKey(k => k + 1);
              // No fade overlay
              setTimeout(() => {
                setConfettiGoalId(null);
                setAnimatingGoalIds(ids => ids.filter(id => id !== item.id));
              }, 1500);
            };
            return (
              <View style={[
                styles.goalItem,
                { borderLeftColor: areaColor }
              ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                  <IconSymbol
                    name={area?.icon || 'star'}
                    size={28}
                    color={areaColor}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, backgroundColor: areaColor + '22', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <IconSymbol name="star" size={15} color={areaColor} style={{ marginRight: 2 }} />
                    <ThemedText type="secondary" style={{ fontWeight: 'bold', color: areaColor, fontSize: 13 }}>+{item.points}</ThemedText>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="secondary" style={styles.goalDesc}>{item.description}</ThemedText>
                  <View style={{ flexDirection: 'column', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <ThemedText type="secondary" style={styles.goalMeta}>
                      <ThemedText style={{
                        color: areaColor || (colorScheme === 'dark' ? '#555' : Colors.light.textSecondary),
                        fontWeight: 'bold',
                      }}>{area?.name || item.areaId}</ThemedText>
                    </ThemedText>
                    <ThemedText style={{ fontStyle: 'italic', color: '#888', marginTop: 2, marginLeft: 2 }}>
                      {(item.repetitionDays && item.repetitionDays.length > 0)
                        ? item.repetitionDays.map(d => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')
                        : 'one-time'}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity style={styles.checkButton} onPress={handleComplete} disabled={isCompleted || animating}>
                  <IconSymbol name={isCompleted || animating ? 'check-circle' : 'radio-button-unchecked'} size={28} color={isCompleted || animating ? '#4CAF50' : '#BDBDBD'} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </ThemedView>
  );
}

export default GoalsScreen;

// Dynamic styles using colorScheme and Colors
// Must be above GoalsScreen to avoid use-before-declaration
const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  settingsButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colorScheme === 'dark' ? '#23272b' : '#fff',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#333' : '#eee',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
    backgroundColor: Colors[colorScheme].background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors[colorScheme].text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: Colors[colorScheme].tint,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors[colorScheme].tint,
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 12,
    fontSize: 16,
    color: Colors[colorScheme].text,
    backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9',
  },
  modalLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
    color: Colors[colorScheme].text,
  },
  pickerRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 2,
  marginBottom: 4,
  },
  areaPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  areaOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 0,
    marginBottom: 8,
    minWidth: 70,
    maxWidth: 100,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    flexShrink: 1,
  },
  areaOptionSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#e0f7fa',
  },
    freqOption: {
      padding: 0,
      width: 32,
      height: 32,
      borderRadius: 4, // slight rounding for square look
      borderWidth: 1,
      borderColor: '#E0E0E0',
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
  freqOptionSelected: {
    borderColor: Colors[colorScheme].tint,
    backgroundColor: colorScheme === 'dark' ? '#1b2e1b' : '#E8F5E9',
  },
  iconOption: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: Colors[colorScheme].tint,
    backgroundColor: colorScheme === 'dark' ? '#1b2e1b' : '#E8F5E9',
  },
  modalCancelBtn: {
    padding: 10,
    marginRight: 8,
  },
  modalSaveBtn: {
    padding: 10,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    marginBottom: 16,
    fontWeight: 'bold',
    color: Colors[colorScheme].text,
  },
  progressBarContainer: {
    height: 32,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    marginBottom: 20,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors[colorScheme].tint,
    borderRadius: 16,
  },
  progressText: {
    alignSelf: 'center',
    fontWeight: 'bold',
    color: Colors[colorScheme].text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    marginLeft: 8,
    color: Colors[colorScheme].tint,
    fontWeight: 'bold',
    fontSize: 18,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorScheme === 'dark' ? '#f5f5f5' : '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 6,
    borderLeftColor: '#4CAF50', // default, overridden inline
  },
  goalDesc: {
    fontSize: 16,
    fontWeight: '500',
    color: colorScheme === 'dark' ? '#22292f' : Colors.light.textSecondary,
  },
  goalMeta: {
    fontSize: 13,
    color: colorScheme === 'dark' ? '#555' : Colors.light.textSecondary,
  },
  goalPoints: {
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? '#22292f' : Colors.light.textSecondary,
    marginRight: 8,
  },
  checkButton: {
    padding: 4,
  },
});
