import { Project, Task, TimeEntry } from '@/types/timeTracking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback } from 'react';

const STORAGE_KEYS = {
  PROJECTS: 'timeTracking_projects',
  TASKS: 'timeTracking_tasks',
  TIME_ENTRIES: 'timeTracking_timeEntries',
  TIMER_STATE: 'timeTracking_timerState',
};

export function useBackupRestore() {
  const exportData = useCallback(async () => {
    try {
      // Get all data from AsyncStorage
      const [projectsData, tasksData, timeEntriesData, timerStateData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.TIME_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.TIMER_STATE),
      ]);

      let projects: Project[] = [];
      let tasks: Task[] = [];
      let timeEntries: TimeEntry[] = [];
      let timerState = null;

      try {
        projects = projectsData ? JSON.parse(projectsData) : [];
        tasks = tasksData ? JSON.parse(tasksData) : [];
        timeEntries = timeEntriesData ? JSON.parse(timeEntriesData) : [];
        timerState = timerStateData ? JSON.parse(timerStateData) : null;
      } catch (parseError) {
        console.error('Failed to parse stored data:', parseError);
        return { success: false, error: 'Failed to parse stored data' };
      }

      // Create backup object
      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        projects,
        tasks,
        timeEntries,
        timerState,
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
          dialogTitle: 'Backup Productivity Data',
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

      // Validate backup structure
      if (!backupData.projects || !backupData.tasks || !backupData.timeEntries) {
        return { success: false, error: 'Invalid backup file format' };
      }

      // Validate that required arrays are actually arrays
      if (!Array.isArray(backupData.projects) || !Array.isArray(backupData.tasks) || !Array.isArray(backupData.timeEntries)) {
        return { success: false, error: 'Invalid data structure in backup file' };
      }

      const projects: Project[] = backupData.projects.map((project: any, index: number) => {
        if (!project.id || !project.name || !project.color) {
          throw new Error(`Invalid project data at index ${index}`);
        }
        return {
          ...project,
          createdAt: new Date(project.createdAt || new Date())
        };
      });

      const tasks: Task[] = backupData.tasks.map((task: any, index: number) => {
        if (!task.id || !task.name || !task.projectId) {
          throw new Error(`Invalid task data at index ${index}`);
        }
        return {
          ...task,
          createdAt: new Date(task.createdAt || new Date())
        };
      });

      const timeEntries: TimeEntry[] = backupData.timeEntries.map((entry: any, index: number) => {
        if (!entry.id || !entry.taskId || !entry.startTime) {
          throw new Error(`Invalid time entry data at index ${index}`);
        }
        
        let periods = undefined;
        if (entry.periods && Array.isArray(entry.periods)) {
          periods = entry.periods.map((period: any) => {
            if (!period.startTime) {
              throw new Error(`Invalid period data in time entry ${entry.id}`);
            }
            return {
              startTime: new Date(period.startTime),
              endTime: period.endTime ? new Date(period.endTime) : undefined,
            };
          });
        }

        return {
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          periods: periods,
        };
      });

      let timerState = null;
      if (backupData.timerState) {
        try {
          timerState = {
            ...backupData.timerState,
            startTime: backupData.timerState.startTime ? new Date(backupData.timerState.startTime) : undefined
          };
        } catch (error) {
          console.warn('Failed to parse timer state:', error);
          timerState = null;
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

      // Save to AsyncStorage
      const storagePromises = [
        AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)),
        AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)),
        AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(timeEntries)),
      ];

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
          timerState: timerState ? 1 : 0
        },
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const validateImportedData = (projects: Project[], tasks: Task[], timeEntries: TimeEntry[], timerState: any) => {
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
  };
} 