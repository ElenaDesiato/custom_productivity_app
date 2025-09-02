import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useGoalsStore } from '@/stores/goalsStore';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

const SETTINGS_KEY = 'goals_settings';

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
}

function getSunday(d: Date) {
  const monday = getMonday(d);
  return new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
}

export default function WeeklyAreaGoalsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const areas = useGoalsStore((s) => s.areas);
  const goals = useGoalsStore((s) => s.goals);
  const weeklyGoals = useGoalsStore((s) => s.weeklyGoals);

  // Get current week range
  const today = new Date();
  const weekStart = getMonday(today).toISOString().slice(0, 10);
  const weekEnd = getSunday(today).toISOString().slice(0, 10);

  // No need to load from AsyncStorage, store handles it
  const loading = false;

  // Calculate points per area for this week
  const areaProgress = areas.map(area => {
    // All goals for this area
    const areaGoals = goals.filter(g => g.areaId === area.id);
    // All completions for this week
    let points = 0;
    for (const goal of areaGoals) {
      for (const date of goal.completedDates || []) {
        if (date >= weekStart && date <= weekEnd) {
          points += goal.points;
        }
      }
    }
    return { ...area, points, weeklyGoal: parseInt(weeklyGoals[area.id] || '', 10) || null };
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme].background }] }>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {loading ? (
          <ThemedText style={{ textAlign: 'center', marginTop: 32 }}>Loading...</ThemedText>
        ) : (
          areaProgress.filter(a => a.weeklyGoal).length === 0 ? (
            <ThemedText style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>
              No weekly goals set. Set them in Goals Settings.
            </ThemedText>
          ) : (
            areaProgress.filter(a => a.weeklyGoal).map(area => {
              if (!area.weeklyGoal) return null;
              const complete = area.points >= area.weeklyGoal;
              return (
                <View key={area.id} style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ backgroundColor: area.color + '22', borderRadius: 16, padding: 2, marginRight: 8 }}>
                      <IconSymbol name={area.icon} size={22} color={area.color} />
                    </View>
                    <ThemedText style={{ fontWeight: 'bold', fontSize: 17, color: area.color }}>{area.name}</ThemedText>
                  </View>
                  <View style={{
                    width: '100%',
                    height: 44,
                    backgroundColor: '#fff',
                    borderRadius: 22,
                    overflow: 'hidden',
                    borderWidth: 3,
                    borderColor: complete ? '#4CAF50' : area.color,
                    justifyContent: 'center',
                    shadowColor: complete ? '#4CAF50' : area.color,
                    shadowOpacity: 0.18,
                    shadowRadius: 8,
                    elevation: 4,
                    position: 'relative',
                  }}>
                    <View style={{
                      height: '100%',
                      width: `${Math.min(100, (area.points/area.weeklyGoal)*100)}%`,
                      backgroundColor: complete ? '#C8F7C5' : area.color + '22',
                      borderRadius: 22,
                      position: 'absolute',
                      left: 0,
                      top: 0,
                    }} />
                    <View style={{ position: 'absolute', width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                      <ThemedText style={{ fontWeight: 'bold', color: complete ? '#388E3C' : area.color, fontSize: 20, marginLeft: 18 }}>{area.points} / {area.weeklyGoal} pts</ThemedText>
                      {complete && (
                        <IconSymbol name="check-circle" size={26} color="#4CAF50" style={{ marginRight: 18 }} />
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 18,
    color: '#2196F3',
  },
});
