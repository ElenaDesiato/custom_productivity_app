import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useGoals } from '@/hooks/useGoals';
import { useSelfCareAreas } from '@/hooks/useSelfCareAreas';
import { Goal } from '@/types/goals';
// import { DEFAULT_GOAL_CATEGORIES } from '@/types/tasksAndGoals';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

// You may need to create or update this modal component for editing/adding goals
// import GoalEditorModal from '@/components/GoalEditorModal';

export default function AllGoalsManager() {
  const colorScheme = useColorScheme() || 'light';
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals();
  const { areas } = useSelfCareAreas();
  const styles = getStyles(colorScheme);
  const [modalVisible, setModalVisible] = useState(false);
  const [desc, setDesc] = useState('');
  const [areaId, setAreaId] = useState('');
  const [points, setPoints] = useState('5');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  // Color is now per area, not user-selected
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  // Color options
  const colorOptions = [
    '#FFFFFF','#FFD600','#FBC02D','#FFB74D','#FF8A65','#E57373','#F06292','#F48FB1','#BA68C8','#9575CD','#7E57C2','#7986CB','#2196F3','#1976D2','#64B5F6','#4FC3F7','#4DD0E1','#81C784','#A1887F','#8D6E63','#90A4AE','#000000',
  ];

  const handleEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setDesc(goal.description);
    setAreaId(goal.areaId);
    setPoints(goal.points.toString());
    setSelectedDays(goal.repetitionDays);
    setShowAreaDropdown(false);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingGoalId(null);
    setDesc('');
    setAreaId('');
    setPoints('5');
    setSelectedDays([]);
    setShowAreaDropdown(false);
    setModalVisible(true);
  };

  const handleDelete = (goalId: string) => {
    deleteGoal(goalId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      {/* Add Goal Button at the top */}
      <TouchableOpacity style={styles.addGoalButton} onPress={handleAdd}>
        <Ionicons name="add" size={22} color="#fff" style={{ marginRight: 8 }} />
        <ThemedText style={styles.addGoalButtonText}>Add Goal</ThemedText>
      </TouchableOpacity>
      {/* Goals List (FlatList, same as main screen) */}
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
        {goals.length === 0 ? (
          <ThemedText style={{ textAlign: 'center', marginTop: 32 }}>No goals yet. Add your first goal!</ThemedText>
        ) : (
          [...goals].sort((a, b) => {
            const areaA = areas.find(area => area.id === a.areaId)?.name || '';
            const areaB = areas.find(area => area.id === b.areaId)?.name || '';
            return areaA.localeCompare(areaB);
          }).map((item) => (
            <View
              key={item.id}
              style={[
                styles.goalItem,
                { borderLeftColor: areas.find(a => a.id === item.areaId)?.color || '#4CAF50' }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                <IconSymbol
                  name={areas.find(a => a.id === item.areaId)?.icon || 'star'}
                  size={28}
                  color={areas.find(a => a.id === item.areaId)?.color || '#2196F3'}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, backgroundColor: (areas.find(a => a.id === item.areaId)?.color || '#FFD600') + '22', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <IconSymbol name="star" size={15} color={areas.find(a => a.id === item.areaId)?.color || '#FFD600'} style={{ marginRight: 2 }} />
                  <ThemedText type="secondary" style={{ fontWeight: 'bold', color: areas.find(a => a.id === item.areaId)?.color || '#FFD600', fontSize: 13 }}>+{item.points}</ThemedText>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="secondary" style={styles.goalDesc}>{item.description}</ThemedText>
                <View style={{ flexDirection: 'column', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <ThemedText type="secondary" style={styles.goalMeta}>
                    <ThemedText style={{
                      color: areas.find(a => a.id === item.areaId)?.color || (colorScheme === 'dark' ? '#555' : Colors.light.textSecondary),
                      fontWeight: 'bold',
                    }}>{areas.find(a => a.id === item.areaId)?.name || item.areaId}</ThemedText>
                  </ThemedText>
                  <ThemedText style={{ fontStyle: 'italic', color: '#888', marginTop: 2, marginLeft: 2 }}>
                    {(item.repetitionDays && item.repetitionDays.length > 0)
                      ? item.repetitionDays.map(d => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')
                      : 'one-time'}
                  </ThemedText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                <TouchableOpacity
                  style={{ padding: 6, marginRight: 2 }}
                  onPress={() => handleEdit(item)}
                  accessibilityLabel="Edit Goal"
                >
                  <Ionicons name="pencil" size={22} color={Colors[colorScheme].textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ padding: 6, marginLeft: 2 }}
                  onPress={() => handleDelete(item.id)}
                  accessibilityLabel="Delete Goal"
                >
                  <Ionicons name="trash" size={22} color="#e53935" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      {/* Add Goal Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme].background }] }>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>New Goal</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                placeholder="Goal description"
                value={desc}
                onChangeText={setDesc}
                style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint, backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
                autoFocus
              />
              <ThemedText style={[styles.modalLabel, { color: Colors[colorScheme].text }]}>Self-Care Area</ThemedText>
              <View style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: Colors[colorScheme].tint,
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: areaId ? (areas.find(a => a.id === areaId)?.color + '22') : (colorScheme === 'dark' ? '#22292f' : '#f9f9f9'),
                  }}
                  onPress={() => setShowAreaDropdown(v => !v)}
                  activeOpacity={0.7}
                >
                  <IconSymbol name={((areas.find(a => a.id === areaId)?.icon) || 'star')} size={20} color={areaId ? (areas.find(a => a.id === areaId)?.color || Colors[colorScheme].tint) : Colors[colorScheme].tint} />
                  <ThemedText style={{ marginLeft: 8, fontSize: 15, color: Colors[colorScheme].text, flex: 1 }} numberOfLines={1}>
                    {areas.find(a => a.id === areaId)?.name || 'Select area...'}
                  </ThemedText>
                  <Ionicons name={showAreaDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={Colors[colorScheme].tint} />
                </TouchableOpacity>
                {showAreaDropdown && (
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 48,
                      borderRadius: 8,
                      shadowColor: '#000',
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 30,
                      borderWidth: 1,
                      borderColor: Colors[colorScheme].tint,
                      zIndex: 9999,
                      backgroundColor: Colors[colorScheme].background,
                    }}
                  >
                    {areas.map(area => (
                      <TouchableOpacity
                        key={area.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderBottomWidth: 1,
                          backgroundColor: area.color + '22',
                          borderWidth: areaId === area.id ? 2 : 1,
                          borderColor: areaId === area.id ? Colors[colorScheme].tint : (colorScheme === 'dark' ? '#333' : '#eee'),
                          borderRadius: 8,
                        }}
                        onPress={() => { setAreaId(area.id); setShowAreaDropdown(false); }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <IconSymbol name={area.icon} size={20} color={area.color} />
                        </View>
                        <ThemedText style={{ marginLeft: 8, fontSize: 15, color: Colors[colorScheme].text, flex: 1, fontWeight: areaId === area.id ? 'bold' : 'normal' }} numberOfLines={1}>
                          {area.name}
                        </ThemedText>
                        {areaId === area.id && (
                          <Ionicons name="checkmark" size={18} color="#4caf50" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <ThemedText style={[styles.modalLabel, { color: Colors[colorScheme].text }]}>Points</ThemedText>
              <TextInput
                placeholder="Points"
                value={points}
                onChangeText={setPoints}
                style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tint, backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
                keyboardType="numeric"
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
              />
              <ThemedText style={[styles.modalLabel, { color: Colors[colorScheme].text }]}>Repetition</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {[0,1,2,3,4,5,6].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={{
                      ...styles.freqOption,
                      borderColor: selectedDays.includes(day) ? '#2196F3' : '#B0B0B0',
                      backgroundColor: selectedDays.includes(day) ? '#2196F322' : 'transparent',
                      marginRight: 4,
                    }}
                    onPress={() => {
                      setSelectedDays((prev) =>
                        prev.includes(day)
                          ? prev.filter((d) => d !== day)
                          : [...prev, day].sort((a, b) => a - b)
                      );
                    }}
                  >
                    <ThemedText style={{
                      fontSize: 11,
                      color: selectedDays.includes(day) ? '#2196F3' : Colors[colorScheme].text,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      lineHeight: 16,
                    }}>
                      {['M','T','W','T','F','S','S'][day]}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={{
                    ...styles.freqOption,
                    borderColor: selectedDays.length === 7 ? '#1976D2' : '#888',
                    borderWidth: 2,
                    backgroundColor: selectedDays.length === 7 ? '#1976D222' : '#f5f5f5',
                    marginLeft: 16,
                    shadowColor: selectedDays.length === 7 ? '#1976D2' : undefined,
                    shadowOpacity: selectedDays.length === 7 ? 0.12 : undefined,
                    shadowRadius: selectedDays.length === 7 ? 2 : undefined,
                  }}
                  onPress={() => setSelectedDays(selectedDays.length === 7 ? [] : [0,1,2,3,4,5,6])}
                >
                  <ThemedText style={{
                    fontSize: 11,
                    color: selectedDays.length === 7 ? '#1976D2' : '#555',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    lineHeight: 16,
                    letterSpacing: 0.5,
                  }}>
                    All
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {/* Color selection removed: color is now per area */}
              <TouchableOpacity
                style={{
                  ...styles.saveButton,
                  backgroundColor: '#2196F3',
                }}
                onPress={async () => {
                  if (!desc.trim()) {
                    Alert.alert('Missing Description', 'Please enter a goal description.');
                    return;
                  }
                  if (!areaId) {
                    Alert.alert('Missing Self-Care Area', 'Please select a self-care area.');
                    return;
                  }
                  let areaIcon = 'star';
                  if (Array.isArray(areas)) {
                    const foundArea = areas.find(a => a.id === areaId);
                    if (foundArea && foundArea.icon) areaIcon = foundArea.icon;
                  }
                  let newGoal;
                  try {
                    const areaColor = areas.find(a => a.id === areaId)?.color || '#4CAF50';
                    newGoal = {
                      id: editingGoalId ? editingGoalId : 'goal-' + Date.now(),
                      description: desc.trim(),
                      areaId,
                      repetitionDays: selectedDays, // store selected days
                      icon: areaIcon,
                      color: areaColor,
                      points: parseInt(points) || 5,
                      completedDates: editingGoalId
                        ? (goals.find(g => g.id === editingGoalId)?.completedDates || [])
                        : [],
                    };
                  } catch (e) {
                    Alert.alert('Error', 'Failed to create goal object.');
                    return;
                  }
                  try {
                    if (editingGoalId) {
                      updateGoal(newGoal);
                    } else {
                      addGoal(newGoal);
                    }
                  } catch (e) {
                    Alert.alert('Error', 'Failed to save goal.');
                    return;
                  }
                  setEditingGoalId(null);
                  setDesc('');
                  setAreaId('');
                  setPoints('5');
                  setSelectedDays([]);
                  setModalVisible(false);
                }}
              >
                <ThemedText style={{ ...styles.saveButtonText, color: '#fff' }}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
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
      zIndex: 1,
    },
    progressText: {
      textAlign: 'center',
      fontWeight: 'bold',
      color: Colors[colorScheme].text,
      fontSize: 16,
      zIndex: 2,
    },
    addGoalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: '#2196F3',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginBottom: 20,
      marginTop: 8,
      marginLeft: 16,
      elevation: 2,
    },
    addGoalButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    areaTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
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
      borderLeftColor: '#4CAF50',
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
      color: Colors[colorScheme].text,
    },
    freqOption: {
      width: 32,
      height: 32,
      borderRadius: 4, 
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
      marginBottom: 4,
    },
  });
}
