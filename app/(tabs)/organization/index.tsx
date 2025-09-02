import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useGoalsStore } from '@/stores/goalsStore';
import { useListerStore } from '@/stores/listerStore';
import { useTasksStore } from '@/stores/tasksStore';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TasksGoalsIndexScreen() {
  const colorScheme = useColorScheme();
  // Tasks: count incomplete (not completed, not archived, and in a list)
  const tasks = useTasksStore(s => s.tasks);
  const lists = useTasksStore(s => s.lists);
  const validListIds = new Set(lists.map(l => l.id));
  const incompleteTasks = tasks.filter(t =>
    !t.completed &&
    !t.archived &&
    t.listId &&
    validListIds.has(t.listId) &&
    !t.deletedList
  ).length;
  // Goals: count incomplete for today
  const goals = useGoalsStore(s => s.goals);
  // Use local YYYY-MM-DD for today (to match goals screen logic)
  const now = new Date();
  now.setHours(0,0,0,0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const todayIdx = now.getDay();
  const incompleteGoalsToday = goals.filter(g => {
    const isCompleted = g.completedDates?.includes(todayStr);
    // Recurring goal: today is in repetitionDays
    if (g.repetitionDays && g.repetitionDays.length > 0) {
      return g.repetitionDays.includes(todayIdx) && !isCompleted;
    }
    // One-time goal: createdDate is today
    if (g.createdDate) {
      return g.createdDate.slice(0, 10) === todayStr && !isCompleted;
    }
    return false;
  }).length;
  // Lister: count items to buy (not in cart) on selected list
  const listerLists = useListerStore(s => s.lists);
  const selectedListId = useListerStore(s => s.selectedListId);
  // If no list is selected but at least one exists, default to the first one
  let selectedList = undefined;
  if (selectedListId && listerLists.length > 0) {
    selectedList = listerLists.find(l => l.id === selectedListId) || listerLists[0];
  } else if (listerLists.length > 0) {
    selectedList = listerLists[0];
  }
  let itemsToBuy = 0;
  if (selectedList) {
    // Find the shopping cart category id for this list
    const cartCat = selectedList.categories.find(c => c.isShoppingCart);
    const cartCatId = cartCat ? cartCat.id : null;
    itemsToBuy = selectedList.items.filter(i =>
      !i.inCart && (!cartCatId || i.categoryId !== cartCatId)
    ).length;
  }

  const navigationItems = [
    {
      title: 'Tasks',
      subtitle: (
        <>
          <ThemedText style={styles.highlightNumber}>{incompleteTasks}</ThemedText>
          {` incomplete task${incompleteTasks === 1 ? '' : 's'}`}
        </>
      ),
      icon: 'checklist' as const,
      route: '/organization/tasks' as const,
      color: '#1976D2', // blue 700
    },
    {
      title: 'Goals',
      subtitle: (
        <>
          <ThemedText style={styles.highlightNumber}>{incompleteGoalsToday}</ThemedText>
          {` goal${incompleteGoalsToday === 1 ? '' : 's'} to complete today`}
        </>
      ),
      icon: 'flag' as const,
      route: '/organization/goals' as const,
      color: '#42A5F5', // blue 400
    },
    {
      title: 'Lister',
      subtitle: (
        <>
          <ThemedText style={styles.highlightNumber}>{itemsToBuy}</ThemedText>
          {` item${itemsToBuy === 1 ? '' : 's'} to buy in `}
          <ThemedText style={styles.listName}>{selectedList ? selectedList.name : 'No list selected'}</ThemedText>
        </>
      ),
      icon: 'list' as const,
      route: '/organization/lister' as const,
      color: '#90CAF9', // blue 200
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.subtitle}>
          Stay organized by making lists, creating tasks and setting goals 
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
            <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
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
    color: '#42A5F5',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 2,
  },
  listName: {
    color: '#42A5F5',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 2,
  },
});
