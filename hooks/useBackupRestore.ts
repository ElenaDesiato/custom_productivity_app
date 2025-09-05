import { saveWeightEntries } from '@/stores/weightStore';
import { Goal, UserSettings as GoalsUserSettings, SelfCareArea } from '@/types/goals';
import { ListerState } from '@/types/lister';
import { Task as OrgTask, TaskList } from '@/types/organization';
import { Project, TimeEntry, Task as TimeTask } from '@/types/timeTracking';
import { cancelWeightReminders, scheduleDailyWeightReminder } from '@/utils/weightNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback } from 'react';
// Define all storage keys used in backup/restore
const STORAGE_KEYS = {
  PROJECTS: 'timeTracking_projects',
  TASKS: 'timeTracking_tasks',
  TIME_ENTRIES: 'timeTracking_timeEntries',
  TIMER_STATE: 'timeTracking_timerState',
  ORG_TASKS: 'organization_tasks',
  ORG_LISTS: 'organization_lists',
  LISTER: 'lister_state',
  GOALS: 'goals',
  GOALS_SETTINGS: 'goals_settings',
  GOALS_AREAS: 'goals_areas',
  CALORIE_MEALS: 'calorie_meals',
  CALORIE_FAVOURITES: 'calorie_favourites',
  CALORIE_GOAL: 'calorie_goal',
  WEIGHT: 'weight_entries',
};

export function useBackupRestore() {
  // Delete all productivity data (time tracking, organization, lister, goals)
  const deleteAllData = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PROJECTS,
        STORAGE_KEYS.TASKS,
        STORAGE_KEYS.TIME_ENTRIES,
        STORAGE_KEYS.TIMER_STATE,
        STORAGE_KEYS.ORG_TASKS,
        STORAGE_KEYS.ORG_LISTS,
        STORAGE_KEYS.LISTER,
        STORAGE_KEYS.GOALS,
        STORAGE_KEYS.GOALS_SETTINGS,
        STORAGE_KEYS.GOALS_AREAS,
        STORAGE_KEYS.CALORIE_MEALS,
        STORAGE_KEYS.CALORIE_FAVOURITES,
        STORAGE_KEYS.CALORIE_GOAL,
        STORAGE_KEYS.WEIGHT,
        'weight_reminder_enabled',
        'weight_reminder_time',
      ]);
      // Cancel weight reminders and reset time
      await cancelWeightReminders();
      await AsyncStorage.setItem('weight_reminder_enabled', 'false');
      await AsyncStorage.setItem('weight_reminder_time', JSON.stringify({ hour: 8, minute: 0 }));
      // Restore default goals state (areas, settings)
      const DEFAULT_AREAS = [
        { id: 'movement', name: 'Movement', icon: 'directions-run', color: '#4CAF50' },
        { id: 'self-kindness', name: 'Self-Kindness', icon: 'favorite', color: '#FFD600' },
        { id: 'nutrition', name: 'Nutrition', icon: 'restaurant', color: '#FF8A65' },
        { id: 'hygiene', name: 'Hygiene', icon: 'water-drop', color: '#2196F3' },
        { id: 'productivity', name: 'Productivity', icon: 'work', color: '#9575CD' },
        { id: 'human-connection', name: 'Human Connection', icon: 'people', color: '#F06292' },
        { id: 'personal', name: 'Personal', icon: 'person', color: '#A1887F' },
      ];
      // Explicitly clear goals list
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS_AREAS, JSON.stringify(DEFAULT_AREAS));
      await AsyncStorage.setItem(
        STORAGE_KEYS.GOALS_SETTINGS,
        JSON.stringify({
          dailyGoal: 20,
          lastCompletionDate: null,
          weeklyGoals: {},
          streak: 0,
          currentStreak: 0,
          highestStreak: 0,
        })
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const exportData = useCallback(async () => {
    try {
      // Get all data from AsyncStorage
      const [
        projectsData, tasksData, timeEntriesData, timerStateData,
        orgTasksData, orgListsData,
        listerData,
        goalsData, goalsSettingsData, goalsAreasData,
        calorieMealsData, calorieFavouritesData, calorieGoalData,
        weightData
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.TIME_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.TIMER_STATE),
        AsyncStorage.getItem(STORAGE_KEYS.ORG_TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.ORG_LISTS),
        AsyncStorage.getItem(STORAGE_KEYS.LISTER),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS_SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS_AREAS),
        AsyncStorage.getItem(STORAGE_KEYS.CALORIE_MEALS),
        AsyncStorage.getItem(STORAGE_KEYS.CALORIE_FAVOURITES),
        AsyncStorage.getItem(STORAGE_KEYS.CALORIE_GOAL),
        AsyncStorage.getItem(STORAGE_KEYS.WEIGHT),
      ]);

      // Always read latest reminder state directly before backup
      const notifEnabledData = await AsyncStorage.getItem('weight_reminder_enabled');
      const notifTimeData = await AsyncStorage.getItem('weight_reminder_time');

      let projects: Project[] = [];
      let tasks: TimeTask[] = [];
      let timeEntries: TimeEntry[] = [];
      let timerState = null;
      let orgTasks: OrgTask[] = [];
      let orgLists: TaskList[] = [];
      let lister: ListerState | null = null;
      let goals: Goal[] = [];
      let goalsSettings: GoalsUserSettings | null = null;
      let goalsAreas: SelfCareArea[] = [];
      let calorieMeals: any[] = [];
      let calorieFavourites: any[] = [];
      let calorieGoal: any = null;
      let weightEntries: any[] = [];
      let notifEnabled: boolean = false;
      let notifTime: { hour: number, minute: number } = { hour: 8, minute: 0 };

      try {
        projects = projectsData ? JSON.parse(projectsData) : [];
        tasks = tasksData ? JSON.parse(tasksData) : [];
        timeEntries = timeEntriesData ? JSON.parse(timeEntriesData) : [];
        timerState = timerStateData ? JSON.parse(timerStateData) : null;
        orgTasks = orgTasksData ? JSON.parse(orgTasksData) : [];
        orgLists = orgListsData ? JSON.parse(orgListsData) : [];
        lister = listerData ? JSON.parse(listerData) : null;
        goals = goalsData ? JSON.parse(goalsData) : [];
        goalsSettings = goalsSettingsData ? JSON.parse(goalsSettingsData) : null;
        goalsAreas = goalsAreasData ? JSON.parse(goalsAreasData) : [];
        calorieMeals = calorieMealsData ? JSON.parse(calorieMealsData) : [];
        calorieFavourites = calorieFavouritesData ? JSON.parse(calorieFavouritesData) : [];
        calorieGoal = calorieGoalData ? JSON.parse(calorieGoalData) : null;
        weightEntries = weightData ? JSON.parse(weightData) : [];
        notifEnabled = notifEnabledData === 'true';
        if (notifTimeData) {
          try {
            const parsed = JSON.parse(notifTimeData);
            if (typeof parsed.hour === 'number' && typeof parsed.minute === 'number') {
              notifTime = parsed;
            }
          } catch {}
        }
      } catch (parseError) {
        console.error('Failed to parse stored data:', parseError);
        return { success: false, error: 'Failed to parse stored data' };
      }

      // Create backup object
  const backupData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
      // Time tracking
      projects,
      tasks,
      timeEntries,
      timerState,
      // Organization
      orgTasks,
      orgLists,
      // Lister
      lister,
      // Goals
      goals,
      goalsSettings,
      goalsAreas,
      // Calorie Counting
      calorieMeals,
      calorieFavourites,
      calorieGoal,
        weightEntries,
        weightReminder: {
          enabled: notifEnabled,
          time: notifTime,
        },
      };

      // Save to file
      const fileName = `productivity_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Backup Productivity Data (all tabs: time tracking, organization, lister, goals)',
        });
      }

      return { success: true, fileName };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const importData = useCallback(async () => {
    try {
      // Pick JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        return { success: false, error: 'No file selected' };
      }

      const fileUri = result.assets[0].uri;
      const jsonContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      let backupData;
      try {
        backupData = JSON.parse(jsonContent);
      } catch (parseError) {
        return { success: false, error: 'Invalid JSON file format' };
      }


      // Validate backup structure (must have all new fields)
      if (
        !('projects' in backupData) ||
        !('tasks' in backupData) ||
        !('timeEntries' in backupData) ||
        !('orgTasks' in backupData) ||
        !('orgLists' in backupData) ||
        !('lister' in backupData) ||
        !('goals' in backupData) ||
        !('goalsSettings' in backupData) ||
        !('goalsAreas' in backupData) ||
        !('weightEntries' in backupData) ||
        !('weightReminder' in backupData)
      ) {
        return { success: false, error: 'Invalid backup file format (missing required fields)' };
      }

      // Parse and convert date fields
      const projects: Project[] = Array.isArray(backupData.projects)
        ? backupData.projects.map((p: any) => ({
            ...p,
            createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
          }))
        : [];

      const tasks: TimeTask[] = Array.isArray(backupData.tasks)
        ? backupData.tasks.map((t: any) => ({
            ...t,
            createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
          }))
        : [];

      const timeEntries: TimeEntry[] = Array.isArray(backupData.timeEntries)
        ? backupData.timeEntries.map((e: any) => ({
            ...e,
            startTime: e.startTime ? new Date(e.startTime) : undefined,
            endTime: e.endTime ? new Date(e.endTime) : undefined,
            periods: e.periods
              ? e.periods.map((period: any) => ({
                  ...period,
                  startTime: period.startTime ? new Date(period.startTime) : undefined,
                  endTime: period.endTime ? new Date(period.endTime) : undefined,
                }))
              : undefined,
          }))
        : [];


      let timerState = backupData.timerState || null;
      if (timerState && timerState.startTime) {
        timerState = { ...timerState, startTime: new Date(timerState.startTime) };
      }

      const orgTasks: OrgTask[] = Array.isArray(backupData.orgTasks) ? backupData.orgTasks : [];
      const orgLists: TaskList[] = Array.isArray(backupData.orgLists) ? backupData.orgLists : [];
      const lister: ListerState | null = backupData.lister || null;
      const goals: Goal[] = Array.isArray(backupData.goals) ? backupData.goals : [];
      // Normalize and preserve all goals settings and self-care areas
      let goalsSettings: any = backupData.goalsSettings || {};
      // Accept both dailyGoal and dailyPointGoal for compatibility
      if (goalsSettings.dailyPointGoal && !goalsSettings.dailyGoal) {
        goalsSettings.dailyGoal = goalsSettings.dailyPointGoal;
      }
      // Merge weeklyGoals from both possible locations
      const backupWeeklyGoals = backupData.weeklyGoals || (goalsSettings.weeklyGoals ? goalsSettings.weeklyGoals : undefined);
      if (backupWeeklyGoals) {
        goalsSettings.weeklyGoals = backupWeeklyGoals;
      }
      // Self-care areas: always use the imported array
      const goalsAreas: SelfCareArea[] = Array.isArray(backupData.goalsAreas) ? backupData.goalsAreas : [];

      // Parse calorie counting data
      const calorieMeals: any[] = Array.isArray(backupData.calorieMeals) ? backupData.calorieMeals : [];
      const calorieFavourites: any[] = Array.isArray(backupData.calorieFavourites) ? backupData.calorieFavourites : [];
      const calorieGoal: any = backupData.calorieGoal ?? null;


      // Parse weight entries
      const weightEntries: any[] = Array.isArray(backupData.weightEntries) ? backupData.weightEntries : [];
      // Parse reminder state
      let notifEnabled = false;
      let notifTime = { hour: 8, minute: 0 };
      if (backupData.weightReminder) {
        notifEnabled = !!backupData.weightReminder.enabled;
        if (
          backupData.weightReminder.time &&
          typeof backupData.weightReminder.time.hour === 'number' &&
          typeof backupData.weightReminder.time.minute === 'number'
        ) {
          notifTime = backupData.weightReminder.time;
        }
      }

      // Validate imported data
      const validation = validateImportedData(projects, tasks, timeEntries, timerState);
      if (validation.errors.length > 0) {
        return { 
          success: false, 
          error: `Data validation failed: ${validation.errors.join(', ')}` 
        };
      }

  // Use store logic for weights
  await saveWeightEntries(weightEntries);
  // Restore reminder state
  await AsyncStorage.setItem('weight_reminder_enabled', notifEnabled ? 'true' : 'false');
  await AsyncStorage.setItem('weight_reminder_time', JSON.stringify(notifTime));
  if (notifEnabled) {
    await scheduleDailyWeightReminder(notifTime.hour, notifTime.minute);
  } else {
    await cancelWeightReminders();
  }

      // Use store logic for weights
      await saveWeightEntries(weightEntries);
      
      if (validation.errors.length > 0) {
        return { 
          success: false, 
          error: `Data validation failed: ${validation.errors.join(', ')}` 
        };
      }

      // Save to AsyncStorage (all tabs)
  const storagePromises = [
        AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)),
        AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)),
        AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(timeEntries)),
        AsyncStorage.setItem(STORAGE_KEYS.ORG_TASKS, JSON.stringify(orgTasks)),
        AsyncStorage.setItem(STORAGE_KEYS.ORG_LISTS, JSON.stringify(orgLists)),
        AsyncStorage.setItem(STORAGE_KEYS.LISTER, JSON.stringify(lister)),
        AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)),
        AsyncStorage.setItem(STORAGE_KEYS.GOALS_SETTINGS, JSON.stringify(goalsSettings)),
        AsyncStorage.setItem(STORAGE_KEYS.GOALS_AREAS, JSON.stringify(goalsAreas)),
        // Calorie Counting
        AsyncStorage.setItem(STORAGE_KEYS.CALORIE_MEALS, JSON.stringify(calorieMeals)),
        AsyncStorage.setItem(STORAGE_KEYS.CALORIE_FAVOURITES, JSON.stringify(calorieFavourites)),
        AsyncStorage.setItem(STORAGE_KEYS.CALORIE_GOAL, JSON.stringify(calorieGoal)),
  ];
  // Use store logic for weights
  await saveWeightEntries(weightEntries);
      if (timerState) {
        storagePromises.push(AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(timerState)));
      }
      await Promise.all(storagePromises);

      return {
        success: true,
        imported: {
          projects: projects.length,
          tasks: tasks.length,
          timeEntries: timeEntries.length,
          timerState: timerState ? 1 : 0,
          orgTasks: orgTasks.length,
          orgLists: orgLists.length,
          listerLists: lister?.lists?.length || 0,
          goals: goals.length,
          goalsAreas: goalsAreas.length,
        },
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const validateImportedData = (projects: Project[], tasks: TimeTask[], timeEntries: TimeEntry[], timerState: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate projects
    if (!Array.isArray(projects)) {
      errors.push('Projects data is not an array');
      return { errors, warnings };
    }

    const projectIds = new Set(projects.map(p => p.id));
    if (projectIds.size !== projects.length) {
      errors.push('Duplicate project IDs found');
    }

    // Validate tasks
    if (!Array.isArray(tasks)) {
      errors.push('Tasks data is not an array');
      return { errors, warnings };
    }

    const taskIds = new Set(tasks.map(t => t.id));
    if (taskIds.size !== tasks.length) {
      errors.push('Duplicate task IDs found');
    }

    // Check for orphaned tasks (tasks without projects)
    const orphanedTasks = tasks.filter(task => !projectIds.has(task.projectId));
    if (orphanedTasks.length > 0) {
      warnings.push(`${orphanedTasks.length} tasks reference non-existent projects`);
    }

    // Validate time entries
    if (!Array.isArray(timeEntries)) {
      errors.push('Time entries data is not an array');
      return { errors, warnings };
    }

    const timeEntryIds = new Set(timeEntries.map(te => te.id));
    if (timeEntryIds.size !== timeEntries.length) {
      errors.push('Duplicate time entry IDs found');
    }

    // Check for orphaned time entries (entries without tasks)
    const orphanedEntries = timeEntries.filter(entry => !taskIds.has(entry.taskId));
    if (orphanedEntries.length > 0) {
      warnings.push(`${orphanedEntries.length} time entries reference non-existent tasks`);
    }

    // Validate timer state
    if (timerState && typeof timerState === 'object') {
      if (timerState.currentTaskId && !taskIds.has(timerState.currentTaskId)) {
        warnings.push('Timer state references non-existent task');
      }
      if (timerState.currentTimeEntryId && !timeEntryIds.has(timerState.currentTimeEntryId)) {
        warnings.push('Timer state references non-existent time entry');
      }
    }

    // Validate periods in time entries
    timeEntries.forEach(entry => {
      if (entry.periods) {
        if (!Array.isArray(entry.periods)) {
          errors.push(`Time entry ${entry.id} has invalid periods format`);
          return;
        }
        
        entry.periods.forEach((period, index) => {
          if (!period || typeof period !== 'object') {
            errors.push(`Invalid period ${index} in time entry ${entry.id}`);
            return;
          }
          
          if (!(period.startTime instanceof Date) || isNaN(period.startTime.getTime())) {
            errors.push(`Invalid start time in period ${index} of entry ${entry.id}`);
          }
          if (period.endTime && (!(period.endTime instanceof Date) || isNaN(period.endTime.getTime()))) {
            errors.push(`Invalid end time in period ${index} of entry ${entry.id}`);
          }
        });
      }
    });

    // Validate data types and required fields
    projects.forEach((project, index) => {
      if (!project || typeof project !== 'object') {
        errors.push(`Project ${index} is not a valid object`);
        return;
      }
      
      if (typeof project.id !== 'string' || !project.id.trim()) {
        errors.push(`Project ${index} has invalid ID`);
      }
      if (typeof project.name !== 'string' || !project.name.trim()) {
        errors.push(`Project ${index} has invalid name`);
      }
      if (typeof project.color !== 'string' || !project.color.trim()) {
        errors.push(`Project ${index} has invalid color`);
      }
      if (!(project.createdAt instanceof Date) || isNaN(project.createdAt.getTime())) {
        errors.push(`Project ${index} has invalid creation date`);
      }
    });

    tasks.forEach((task, index) => {
      if (!task || typeof task !== 'object') {
        errors.push(`Task ${index} is not a valid object`);
        return;
      }
      
      if (typeof task.id !== 'string' || !task.id.trim()) {
        errors.push(`Task ${index} has invalid ID`);
      }
      if (typeof task.name !== 'string' || !task.name.trim()) {
        errors.push(`Task ${index} has invalid name`);
      }
      if (typeof task.projectId !== 'string' || !task.projectId.trim()) {
        errors.push(`Task ${index} has invalid project ID`);
      }
      if (!(task.createdAt instanceof Date) || isNaN(task.createdAt.getTime())) {
        errors.push(`Task ${index} has invalid creation date`);
      }
    });

    timeEntries.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        errors.push(`Time entry ${index} is not a valid object`);
        return;
      }
      
      if (typeof entry.id !== 'string' || !entry.id.trim()) {
        errors.push(`Time entry ${index} has invalid ID`);
      }
      if (typeof entry.taskId !== 'string' || !entry.taskId.trim()) {
        errors.push(`Time entry ${index} has invalid task ID`);
      }
      if (!(entry.startTime instanceof Date) || isNaN(entry.startTime.getTime())) {
        errors.push(`Time entry ${index} has invalid start time`);
      }
      if (entry.endTime && (!(entry.endTime instanceof Date) || isNaN(entry.endTime.getTime()))) {
        errors.push(`Time entry ${index} has invalid end time`);
      }
      if (entry.duration !== undefined && (typeof entry.duration !== 'number' || entry.duration < 0)) {
        errors.push(`Time entry ${index} has invalid duration`);
      }
    });

    return { errors, warnings };
  };

  return {
    exportData,
    importData,
    deleteAllData,
  };
}