import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { estimateCaloriesFromDescription } from '@/stores/aiCalorieEstimate';
import { Meal, useCalorieStore } from '@/stores/calorieStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getTodayStr() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

const defaultSex = 'female';
const defaultAge = 30;
const defaultWeight = 70;
const defaultHeight = 170;
const defaultActivity = 'moderate';

// Type for goalForm
type GoalForm = {
  sex: string;
  age: string;
  weight: string;
  height: string;
  activity: string;
  customGoal: string;
  desiredWeightChange?: 'maintenance' | 'mild-loss' | 'loss' | 'extreme-loss' | 'mild-gain' | 'gain' | 'extreme-gain';
};

export default function CalorieCountingScreen() {
  const [currentDay, setCurrentDay] = useState(getTodayStr());
  const { meals, favourites, goal, load, addMeal, updateMeal, deleteMeal, addFavourite, removeFavourite, setGoal } = useCalorieStore();
  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayStr();
      if (today !== currentDay) {
        setCurrentDay(today);
        load(); // reload meals for the new day
      }
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [currentDay, load]);
  const colorScheme = useColorScheme();
  const [showAdd, setShowAdd] = useState(false);
  const [showFavourites, setShowFavourites] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<null | { calories: number; grams: number; caloriesPer100g: number; aiSource: string }>(null);
  const [input, setInput] = useState({ description: '', grams: '', caloriesPer100g: '' });
  const [aiInput, setAiInput] = useState('');
  const [editMeal, setEditMeal] = useState<Meal | null>(null);
  const [goalForm, setGoalForm] = useState<GoalForm>({
  sex: defaultSex,
  age: defaultAge.toString(),
  weight: defaultWeight.toString(),
  height: defaultHeight.toString(),
  activity: defaultActivity,
  customGoal: '',
  });

  // Persist goalForm to AsyncStorage
  const saveGoalForm = async (form: GoalForm) => {
    try {
      await AsyncStorage.setItem('calorieGoalForm', JSON.stringify(form));
    } catch (e) {}
  };

  // Load goalForm from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('calorieGoalForm');
        if (stored) setGoalForm(JSON.parse(stored));
      } catch (e) {}
    })();
  }, []);
  const [goalSet, setGoalSet] = useState(false);
  const [goalFormOpen, setGoalFormOpen] = useState(false);

  useEffect(() => { load(); }, []);

  const todayMeals = meals.filter(m => m.date === getTodayStr());
  const totalCalories = todayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
  // Calorie calculation using Mifflin-St Jeor Equation
  function calculateGoal() {
    const age = parseInt(goalForm.age) || defaultAge;
    const weight = parseInt(goalForm.weight) || defaultWeight;
    const height = parseInt(goalForm.height) || defaultHeight;
    let activityMult = 1.55;
    if (goalForm.activity === 'low') activityMult = 1.2;
    if (goalForm.activity === 'high') activityMult = 1.725;
    let bmr = 0;
    if (goalForm.sex === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    let goal = bmr * activityMult;
    // Adjust for weight change goal
    // Based on calculator.net: mild = 250, moderate = 500, extreme = 1000 kcal offset
    switch (goalForm.desiredWeightChange) {
      case 'mild-loss':
        goal -= 250;
        break;
      case 'loss':
        goal -= 500;
        break;
      case 'extreme-loss':
        goal -= 1000;
        break;
      case 'mild-gain':
        goal += 250;
        break;
      case 'gain':
        goal += 500;
        break;
      case 'extreme-gain':
        goal += 1000;
        break;
      // maintenance: no change
    }
    return Math.round(goal);
  }
  const calculatedGoal = calculateGoal();
  // If user has modified the input, use that, otherwise use calculatedGoal
  const [goalInput, setGoalInput] = useState('');
  useEffect(() => {
    setGoalInput(calculatedGoal.toString());
  }, [calculatedGoal, goalForm.sex, goalForm.age, goalForm.weight, goalForm.height, goalForm.activity, goalForm.desiredWeightChange]);
  const calorieGoal = goal?.value || parseInt(goalInput) || calculatedGoal;

  // --- UI Handlers ---
  const handleAddMeal = async () => {
    if (!input.description || !input.grams || !input.caloriesPer100g) return;
    const grams = parseFloat(input.grams);
    const caloriesPer100g = parseFloat(input.caloriesPer100g);
    const totalCalories = Math.round((grams * caloriesPer100g) / 100);
    const meal: Meal = {
      id: editMeal?.id || generateId(),
      description: input.description,
      grams,
      caloriesPer100g,
      totalCalories,
      date: getTodayStr(),
    };
    if (editMeal) {
      await updateMeal(meal);
      setEditMeal(null);
    } else {
      await addMeal(meal);
    }
    setInput({ description: '', grams: '', caloriesPer100g: '' });
    setShowAdd(false);
  };

  const handleDeleteMeal = (id: string) => {
    deleteMeal(id);
  };

  const handleEditMeal = (meal: Meal) => {
    setEditMeal(meal);
    setInput({
      description: meal.description,
      grams: meal.grams.toString(),
      caloriesPer100g: meal.caloriesPer100g.toString(),
    });
    setShowAdd(true);
  };

    const handleOpenAddMeal = () => {
      setEditMeal(null);
      setInput({ description: '', grams: '', caloriesPer100g: '' });
      setShowAdd(true);
    };
  const handleAddFavourite = async (meal: Meal) => {
    await addFavourite(meal);
  };

  const handleRemoveFavourite = async (id: string) => {
    await removeFavourite(id);
  };

  const handleAI = async () => {
    if (!aiInput) return;
    setAiLoading(true);
    const result = await estimateCaloriesFromDescription(aiInput);
    setAiResult(result);
    setAiLoading(false);
  };

  const handleSetGoal = async () => {
    if (goalForm.customGoal) {
      const goalValue = parseInt(goalForm.customGoal);
      if (!isNaN(goalValue)) {
        await setGoal({ value: goalValue, isCustom: true });
        setGoalSet(true);
        return;
      }
    }
    await setGoal({ value: calculateGoal(), isCustom: false });
    setGoalSet(true);
  };

  // --- UI ---
  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
      {/* Calorie Counter at Top */}
      <View style={styles.centeredTop}>
        <ThemedText style={styles.counterText}>{totalCalories} kcal</ThemedText>
      </View>
      {/* Progress Bar with Goal */}
      <View style={styles.progressBarContainer}>
        {(() => {
          const percent = totalCalories / calorieGoal;
          let bgColor = '#E8F5E9'; // light green
          let fillColor = '#43A047'; // green
          if (percent > 0.4 && percent <= 0.7) {
            bgColor = '#FFF9C4'; // light yellow
            fillColor = '#FBC02D'; // yellow
          }
          if (percent > 0.7 && percent <= 1) {
            bgColor = '#FFE0B2'; // light orange
            fillColor = '#FB8C00'; // orange
          }
          if (percent > 1) {
            bgColor = '#FFCDD2'; // light red
            fillColor = '#E53935'; // red
          }
          return (
            <View style={[styles.progressBarBg, { backgroundColor: bgColor }] }>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, percent * 100)}%`, backgroundColor: fillColor }]} />
              <View style={styles.progressBarLabelContainer}>
                <ThemedText style={styles.progressBarLabel}>{totalCalories} / {calorieGoal} kcal</ThemedText>
              </View>
            </View>
          );
        })()}
      </View>
      {/* Add Meal & Favourite Meal Buttons */}
      <View style={styles.buttonRow}>
    <TouchableOpacity style={styles.bigButton} onPress={handleOpenAddMeal}>
            <IconSymbol name="add" size={28} color="#fff" />
            <ThemedText style={styles.bigButtonText}>Add Meal</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.favButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]} onPress={() => setShowFavourites(true)}>
            <IconSymbol name="star" size={28} color="#9C27B0" />
            <ThemedText style={styles.favButtonText}>Favourite Meals</ThemedText>
          </TouchableOpacity>
      </View>
      {/* Goal Questionnaire Dropdown */}
      <View style={styles.goalDropdownContainer}>
        <TouchableOpacity onPress={() => setGoalFormOpen(open => !open)} style={styles.goalDropdownHeader}>
          <ThemedText style={styles.goalFormTitle}>Set Your Calories Goal</ThemedText>
          <IconSymbol name={goalFormOpen ? 'expand-less' : 'expand-more'} size={20} color="#9C27B0" />
        </TouchableOpacity>
        {goalFormOpen && (
          <View style={styles.goalForm}>
            <View style={styles.goalFormRow}>
              <ThemedText style={{ color: '#222', fontWeight: 'bold' }}>Sex:</ThemedText>
              <TouchableOpacity style={[styles.activityButton, goalForm.sex === 'female' && styles.activityButtonActive]} onPress={() => { const next = { ...goalForm, sex: 'female' }; setGoalForm(next); saveGoalForm(next); }}><ThemedText style={{ color: goalForm.sex === 'female' ? '#fff' : '#222', textAlign: 'center', alignSelf: 'stretch' }}>Female</ThemedText></TouchableOpacity>
              <TouchableOpacity style={[styles.activityButton, goalForm.sex === 'male' && styles.activityButtonActive]} onPress={() => { const next = { ...goalForm, sex: 'male' }; setGoalForm(next); saveGoalForm(next); }}><ThemedText style={{ color: goalForm.sex === 'male' ? '#fff' : '#222', textAlign: 'center', alignSelf: 'stretch'  }}>Male</ThemedText></TouchableOpacity>
            </View>
            {/* ...other form rows... */}
            <View style={[styles.goalFormRow, { flexWrap: 'wrap', flexDirection: 'row', alignItems: 'flex-start' }]}> 
              <ThemedText style={{ color: '#222', fontWeight: 'bold', minWidth: 90 }}>Goal Type:</ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                <TouchableOpacity style={[styles.activityButton, (!goalForm.desiredWeightChange || goalForm.desiredWeightChange === 'maintenance') && styles.activityButtonActive]} onPress={() => { const next: GoalForm = { ...goalForm, desiredWeightChange: 'maintenance' }; setGoalForm(next); saveGoalForm(next); }}>
                  <ThemedText style={{ color: (!goalForm.desiredWeightChange || goalForm.desiredWeightChange === 'maintenance') ? '#fff' : '#222', textAlign: 'center', alignSelf: 'stretch' }}>Maintenance</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.activityButton, goalForm.desiredWeightChange === 'mild-loss' && styles.activityButtonActive]} onPress={() => { const next: GoalForm = { ...goalForm, desiredWeightChange: 'mild-loss' }; setGoalForm(next); saveGoalForm(next); }}>
                  <ThemedText style={{ color: goalForm.desiredWeightChange === 'mild-loss' ? '#fff' : '#222', textAlign: 'center', alignSelf: 'stretch' }}>Mild Loss</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.activityButton, goalForm.desiredWeightChange === 'loss' && styles.activityButtonActive]} onPress={() => { const next: GoalForm = { ...goalForm, desiredWeightChange: 'loss' }; setGoalForm(next); saveGoalForm(next); }}>
                  <ThemedText style={{ color: goalForm.desiredWeightChange === 'loss' ? '#fff' : '#222', textAlign: 'center', alignSelf: 'stretch' }}>Loss</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.activityButton, goalForm.desiredWeightChange === 'mild-gain' && styles.activityButtonActive]} onPress={() => { const next: GoalForm = { ...goalForm, desiredWeightChange: 'mild-gain' }; setGoalForm(next); saveGoalForm(next); }}>
                  <ThemedText style={{ color: goalForm.desiredWeightChange === 'mild-gain' ? '#fff' : '#222', textAlign: 'center', alignSelf: 'stretch' }}>Mild Gain</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.activityButton, goalForm.desiredWeightChange === 'gain' && styles.activityButtonActive]} onPress={() => { const next: GoalForm = { ...goalForm, desiredWeightChange: 'gain' }; setGoalForm(next); saveGoalForm(next); }}>
                  <ThemedText style={{ color: goalForm.desiredWeightChange === 'gain' ? '#fff' : '#222', textAlign: 'center', alignSelf: 'stretch' }}>Gain</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.goalFormRow}>
              <ThemedText style={{ color: '#222', fontWeight: 'bold' }}>Age:</ThemedText>
              <TextInput style={[styles.goalInput, { color: '#222', marginLeft: 62 }]} value={goalForm.age} onChangeText={t => { const next = { ...goalForm, age: t }; setGoalForm(next); saveGoalForm(next); }} keyboardType="numeric" placeholderTextColor="#888" />
            </View>
            <View style={styles.goalFormRow}>
              <ThemedText style={{ color: '#222', fontWeight: 'bold' }}>Weight (kg):</ThemedText>
              <TextInput style={[styles.goalInput, { color: '#222' }]} value={goalForm.weight} onChangeText={t => { const next = { ...goalForm, weight: t }; setGoalForm(next); saveGoalForm(next); }} keyboardType="numeric" placeholderTextColor="#888" />
            </View>
            <View style={styles.goalFormRow}>
              <ThemedText style={{ color: '#222', fontWeight: 'bold' }}>Height (cm):</ThemedText>
              <TextInput style={[styles.goalInput, { color: '#222' }]} value={goalForm.height} onChangeText={t => { const next = { ...goalForm, height: t }; setGoalForm(next); saveGoalForm(next); }} keyboardType="numeric" placeholderTextColor="#888" />
            </View>
            <View style={styles.goalFormRow}>
              <ThemedText style={{ color: '#222', fontWeight: 'bold' }}>Activity:</ThemedText>
              <TouchableOpacity style={[styles.activityButton, goalForm.activity === 'low' && styles.activityButtonActive]} onPress={() => { const next = { ...goalForm, activity: 'low' }; setGoalForm(next); saveGoalForm(next); }}>
                <ThemedText style={{ color: goalForm.activity === 'low' ? '#fff' : '#222', textAlign: 'center', alignSelf: 'stretch' }} numberOfLines={1} ellipsizeMode="tail">Low</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.activityButton, goalForm.activity === 'moderate' && styles.activityButtonActive]} onPress={() => { const next = { ...goalForm, activity: 'moderate' }; setGoalForm(next); saveGoalForm(next); }}>
                <ThemedText style={{ color: goalForm.activity === 'moderate' ? '#fff' : '#222', textAlign: 'center', alignSelf: 'stretch' }} numberOfLines={1} ellipsizeMode="tail">Moderate</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.activityButton, goalForm.activity === 'high' && styles.activityButtonActive]} onPress={() => { const next = { ...goalForm, activity: 'high' }; setGoalForm(next); saveGoalForm(next); }}>
                <ThemedText style={{ color: goalForm.activity === 'high' ? '#fff' : '#222', textAlign: 'center', alignSelf: 'stretch' }} numberOfLines={1} ellipsizeMode="tail">High</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.goalFormRow}>
              <ThemedText style={{ color: '#9C27B0', fontWeight: 'bold' }}>Your Daily Goal (kcal):</ThemedText>
              <TextInput
                style={[styles.goalInput, { color: '#9C27B0', fontWeight: 'bold' }]}
                value={goalInput}
                onChangeText={t => setGoalInput(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder={calculatedGoal.toString()}
                placeholderTextColor="#888"
              />
            </View>
            <TouchableOpacity style={styles.setGoalButton} onPress={async () => {
              const goalValue = parseInt(goalInput);
              if (!isNaN(goalValue)) {
                await setGoal({ value: goalValue, isCustom: goalValue !== calculatedGoal });
                setGoalSet(true);
              }
            }}>
              <ThemedText style={styles.setGoalButtonText}>Set Goal</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Meals List */}
      <View style={styles.mealListContainer}>
        <ThemedText style={styles.mealListTitle}>Today's Meals</ThemedText>
        {todayMeals.length === 0 ? (
          <ThemedText style={styles.emptyText}>No meals logged yet.</ThemedText>
        ) : (
          <FlatList
            data={todayMeals}
            keyExtractor={m => m.id}
            renderItem={({ item }) => (
              <View style={styles.mealRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.mealName}>{item.description}</ThemedText>
                  <ThemedText type="secondary">{item.grams}g • {item.totalCalories} kcal</ThemedText>
                </View>
                <View style={styles.mealIconRow}>
                  <TouchableOpacity onPress={() => handleEditMeal(item)}>
                    <IconSymbol name="edit" size={20} color="#9C27B0" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteMeal(item.id)}>
                    <IconSymbol name="delete" size={20} color="#9C27B0" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleAddFavourite(item)}>
                    <IconSymbol name="star" size={20} color={favourites.some(f => f.id === item.id) ? '#FFD600' : '#9C27B0'} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
      {/* Add/Edit Meal Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }] }>
            <TouchableOpacity style={styles.modalCloseX} onPress={() => { setShowAdd(false); setEditMeal(null); }}>
                <IconSymbol name="close" size={28} color="#888" />
              </TouchableOpacity>
              <ThemedText style={styles.modalTitle}>{editMeal ? 'Edit Meal' : 'Add Meal'}</ThemedText>
              <TextInput
                style={styles.textInput}
                value={input.description}
                onChangeText={text => setInput({ ...input, description: text })}
                placeholder="Description"
              />
              <TextInput
                style={styles.textInput}
                value={input.grams}
                onChangeText={text => setInput({ ...input, grams: text })}
                placeholder="Grams"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.textInput}
                value={input.caloriesPer100g}
                onChangeText={text => setInput({ ...input, caloriesPer100g: text })}
                placeholder="kcal/100g"
                keyboardType="numeric"
              />
              {/* AI Estimation Option (currently unavailable) */}
              <View style={styles.aiOptionUnavailable}>
                <ThemedText style={styles.aiOptionText}>Estimate meal with AI (coming soon)</ThemedText>
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddMeal}>
                <ThemedText style={styles.saveButtonText}>{editMeal ? 'Save' : 'Add'}</ThemedText>
              </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Favourites Modal */}
      <Modal visible={showFavourites} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }] }>
            <TouchableOpacity style={styles.modalCloseX} onPress={() => setShowFavourites(false)}>
              <IconSymbol name="close" size={28} color="#333" />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Favourites</ThemedText>
            {favourites.length === 0 ? (
              <ThemedText style={styles.emptyText}>No favourites yet.</ThemedText>
            ) : (
              <FlatList
                data={favourites}
                keyExtractor={m => m.id}
                renderItem={({ item }) => (
                  <View style={styles.mealRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.mealName}>{item.description}</ThemedText>
                      <ThemedText type="secondary">{item.grams}g • {item.totalCalories} kcal</ThemedText>
                    </View>
                    <View style={styles.favMealIconRow}>
                      <TouchableOpacity style={styles.addMealBtn} onPress={() => addMeal({ ...item, id: generateId(), date: getTodayStr() })}>
                        <ThemedText style={styles.addMealBtnText}>Add Meal</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveFavourite(item.id)}>
                        <IconSymbol name="delete" size={20} color="#9C27B0" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  favMealIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 16 },
  addMealBtn: { backgroundColor: '#E1BEE7', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16, marginRight: 8 },
  addMealBtnText: { color: '#9C27B0', fontWeight: 'bold', fontSize: 15 },
  modalCloseX: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  container: { flex: 1, padding: 10 },
  centeredTop: { alignItems: 'center', marginTop: 8, marginBottom: 8 },
  counterText: { fontSize: 32, fontWeight: 'bold', color: '#9C27B0', backgroundColor: 'transparent', zIndex: 2 },
  progressBarContainer: { alignItems: 'center', marginTop: 0, marginBottom: 16, zIndex: 1 },
  progressBarBg: { width: '100%', height: 24, backgroundColor: '#E1BEE7', borderRadius: 12, overflow: 'hidden', marginBottom: 4, justifyContent: 'center' },
  progressBarFill: { height: 24, backgroundColor: '#9C27B0', borderRadius: 12, position: 'absolute', left: 0, top: 0 },
  progressBarLabelContainer: { position: 'absolute', width: '100%', height: 24, justifyContent: 'center', alignItems: 'center' },
  progressBarLabel: {
    fontSize: 16,
    color: '#4A0072', 
    fontWeight: '600',
    backgroundColor: 'transparent',
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  bigButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#9C27B0', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12, marginHorizontal: 4, minWidth: 120 },
  bigButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  favButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12, marginHorizontal: 4, borderWidth: 2, borderColor: '#9C27B0', minWidth: 120 },
  favButtonText: { color: '#9C27B0', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  goalDropdownContainer: { marginBottom: 20 },
  goalDropdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F3E5F5', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 16 },
  goalForm: { backgroundColor: '#F3E5F5', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 16, marginBottom: 0 },
  goalFormTitle: { fontSize: 18, fontWeight: 'bold', color: '#9C27B0', marginBottom: 0 },
  goalFormRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  goalInput: { width: 90, borderWidth: 1, borderColor: '#9C27B0', borderRadius: 8, padding: 8, marginLeft: 8, backgroundColor: '#fff', textAlign: 'center' },
  activityButton: { paddingVertical: 10, paddingHorizontal: 0, borderRadius: 8, backgroundColor: '#E1BEE7', marginHorizontal: 4, alignItems: 'center',flexGrow: 1,minWidth: 0},
  activityButtonActive: { backgroundColor: '#9C27B0' },
  setGoalButton: { backgroundColor: '#9C27B0', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  setGoalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  mealListContainer: { flex: 1, marginTop: 8 },
  mealListTitle: { fontSize: 20, fontWeight: 'bold', color: '#9C27B0', marginBottom: 8 },
  emptyText: { color: '#aaa', fontStyle: 'italic', textAlign: 'center', marginTop: 16 },
  mealRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#F5F5F5', borderRadius: 8, padding: 8 },
  mealName: { fontSize: 17, fontWeight: 'bold', color: '#9C27B0', marginBottom: 2 },
  mealIconRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginLeft: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'stretch' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#9C27B0', marginBottom: 16, textAlign: 'center' },
  saveButton: { backgroundColor: '#9C27B0', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { backgroundColor: '#E1BEE7', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: '#9C27B0', fontWeight: 'bold', fontSize: 16 },
  textInput: { borderWidth: 1, borderColor: '#9C27B0', borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 8, backgroundColor: '#fff' },
  aiOptionUnavailable: { marginTop: 16, marginBottom: 8, backgroundColor: '#E1BEE7', borderRadius: 8, padding: 12, alignItems: 'center' },
  aiOptionText: { color: '#9C27B0', fontWeight: 'bold', fontSize: 16 },
  calculatedGoalText: { color: '#9C27B0', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  bottomGoalContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 8 },
  bottomGoalLabel: { fontSize: 16, color: '#9C27B0', marginRight: 8 },
  bottomGoalInput: { borderWidth: 1, borderColor: '#9C27B0', borderRadius: 8, padding: 8, width: 80, textAlign: 'center', backgroundColor: '#fff', fontSize: 16, color: '#9C27B0' },
  bottomGoalUnit: { fontSize: 16, color: '#9C27B0', marginLeft: 8 },
});
