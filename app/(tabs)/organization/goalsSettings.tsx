import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSelfCareAreas } from '@/hooks/useSelfCareAreas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SETTINGS_KEY = 'goals_settings';


type WeeklyGoals = { [areaId: string]: string };

export default function GoalsSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { areas } = useSelfCareAreas();
  const [dailyGoal, setDailyGoal] = useState<string>('20');
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(data => {
      if (data) {
        const parsed = JSON.parse(data);
        setDailyGoal(parsed.dailyGoal || '20');
        setWeeklyGoals(parsed.weeklyGoals || {});
      }
      setLoading(false);
    });
  }, []);

  const saveSettings = async () => {
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ dailyGoal, weeklyGoals })
    );
  };

  const handleWeeklyGoalChange = (areaId: string, value: string) => {
    setWeeklyGoals(prev => ({ ...prev, [areaId]: value }));
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('./manageGoals')}>
          <Text style={styles.buttonText}>Manage All Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('./manageAreas')}>
          <Text style={styles.buttonText}>Manage Self-Care Areas</Text>
        </TouchableOpacity>
        <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Daily Point Goal</Text>
        <TextInput
          style={{
            backgroundColor: colorScheme === 'dark' ? '#23272b' : '#2196F3',
            borderWidth: 2,
            borderColor: '#2196F3',
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 14,
            fontSize: 18,
            color: '#fff',
            fontWeight: 'bold',
            marginBottom: 12,
            marginTop: 4,
          }}
          value={dailyGoal}
          onChangeText={setDailyGoal}
          keyboardType="numeric"
          placeholder="Enter daily goal"
          placeholderTextColor="#fff"
          onBlur={saveSettings}
        />
        <Text style={[styles.label, { color: Colors[colorScheme].text, marginTop: 20 }]}>Weekly Goals by Self-Care Area</Text>
        <View style={{ gap: 8 }}>
          {areas.map(area => (
            <View key={area.id} style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colorScheme === 'dark' ? '#23272b' : '#f5faff',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: area.color,
              paddingVertical: 7,
              paddingHorizontal: 10,
              marginBottom: 2,
              gap: 8,
              minHeight: 44,
            }}>
              <View style={{ marginRight: 8 }}>
                <View style={{ backgroundColor: area.color + '22', borderRadius: 16, padding: 2 }}>
                  <IconSymbol name={area.icon} size={22} color={area.color} />
                </View>
              </View>
              <Text style={{ color: Colors[colorScheme].tint, fontWeight: 'bold', fontSize: 15, minWidth: 80 }}>{area.name}</Text>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                <TextInput
                  style={{
                    backgroundColor: colorScheme === 'dark' ? '#22292f' : '#fff',
                    borderWidth: 1.5,
                    borderColor: '#2196F3',
                    borderRadius: 8,
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                    fontSize: 15,
                    color: Colors[colorScheme].text,
                    fontWeight: 'bold',
                    minWidth: 60,
                    maxWidth: 100,
                    textAlign: 'center',
                  }}
                  value={weeklyGoals[area.id] ?? ''}
                  onChangeText={val => handleWeeklyGoalChange(area.id, val)}
                  keyboardType="numeric"
                  placeholder="-"
                  placeholderTextColor="#2196F3"
                  onBlur={saveSettings}
                />
                <Text style={{ color: Colors[colorScheme].textSecondary, fontSize: 13, marginLeft: 8, minWidth: 24, textAlign: 'right' }}>pts</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
});
