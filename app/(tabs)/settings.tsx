import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useBackupRestore } from '@/hooks/useBackupRestore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useGoalsStore } from '@/stores/goalsStore';
import { useTimeTrackingStore } from '@/stores/timeTrackingStore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';




export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { exportData, importData, deleteAllData } = useBackupRestore();
  // Zustand selectors
  const loadData = useTimeTrackingStore(s => s.loadData);
  const resetData = useTimeTrackingStore(s => s.resetData);
  // Goals store reloads
  const reloadGoals = useGoalsStore(s => s.reloadGoals);
  const reloadAreas = useGoalsStore(s => s.reloadAreas);
  const reloadUserSettings = useGoalsStore(s => s.reloadUserSettings);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Load data when screen mounts
  useEffect(() => {
    loadData();
  }, [loadData]);


  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportData();
      if (result.success) {
        await loadData(); // reload all state after export (in case of side effects)
        Alert.alert(
          'Backup Successful',
          `Your data has been exported to: ${result.fileName}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Export Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      Alert.alert('Export Failed', 'An unexpected error occurred');
    } finally {
      setIsExporting(false);
    }
  };


  const handleImport = async () => {
    Alert.alert(
      'Import Data',
      'This will replace all your current data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            setIsImporting(true);
            try {
              const result = await importData();
              if (result.success) {
                await loadData(); // reload all state after import
                // Immediately reload goals state so UI updates
                await Promise.all([
                  reloadGoals(),
                  reloadAreas(),
                  reloadUserSettings(),
                ]);
                Alert.alert(
                  'Import Successful',
                  'Your data has been restored!',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Import Failed', result.error || 'Unknown error occurred');
              }
            } catch (error) {
              Alert.alert('Import Failed', 'An unexpected error occurred');
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };


  const handleClearData = async () => {
    Alert.alert(
      'Clear All Data',
      `This will permanently delete all your data. This action cannot be undone. Are you absolutely sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              const result = await deleteAllData();
              await loadData(); // reload all state after deletion
              if (result.success) {
                // Immediately reload goals state so UI updates
                await Promise.all([
                  reloadGoals(),
                  reloadAreas(),
                  reloadUserSettings(),
                ]);
                Alert.alert(
                  'Data Cleared',
                  'All your data has been permanently deleted.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Clear Failed', result.error || 'An error occurred while clearing data');
              }
            } catch (error) {
              console.error('Clear data error:', error);
              Alert.alert('Clear Failed', 'An error occurred while clearing data');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      padding: 20,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme ?? 'light'].text,
      marginBottom: 15,
    },
    card: {
      backgroundColor: '#F5F5F5',
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors[colorScheme ?? 'light'].textSecondary,
      marginBottom: 8,
    },
    cardDescription: {
      fontSize: 14,
      color: Colors[colorScheme ?? 'light'].textSecondary,
      marginBottom: 15,
      lineHeight: 20,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors[colorScheme ?? 'light'].tint,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      minHeight: 48,
    },
    buttonText: {
      color: Colors[colorScheme ?? 'light'].textSecondary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    buttonTextPrimary: {
      color: Colors[colorScheme ?? 'light'].tint,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    buttonDisabled: {
      backgroundColor: Colors[colorScheme ?? 'light'].textSecondary,
    },
    dangerButton: {
      backgroundColor: '#ff4444',
    },
    infoText: {
      fontSize: 12,
      color: Colors[colorScheme ?? 'light'].textSecondary,
      marginTop: 10,
      fontStyle: 'italic',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backup Data</Text>
          <Text style={styles.cardDescription}>
            Export all your data to a JSON file. 
            This file can be saved to your device or shared via email/cloud storage.
          </Text>
          <TouchableOpacity
            style={[styles.button, isExporting && styles.buttonDisabled]}
            onPress={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color={Colors[colorScheme ?? 'light'].textSecondary} size="small" />
            ) : (
              <IconSymbol size={20} name="file-download" color={Colors[colorScheme ?? 'light'].textSecondary} />
            )}
            <Text style={styles.buttonText}>
              {isExporting ? 'Exporting...' : 'Export to JSON'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.infoText}>
            The backup file will be named: productivity_backup_YYYY-MM-DD.json
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Restore Data</Text>
          <Text style={styles.cardDescription}>
            Import data from a previously exported JSON file. 
            This will replace all your current data, so make sure to backup first.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton, isImporting && styles.buttonDisabled]}
            onPress={handleImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <IconSymbol size={20} name="file-upload" color="#fff" />
            )}
            <Text style={styles.buttonTextPrimary}>
              {isImporting ? 'Importing...' : 'Import from JSON'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.infoText}>
            ⚠️ This will replace all existing data. Use with caution.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clear All Data</Text>
          <Text style={styles.cardDescription}>
            Permanently delete all the data associated with this app.
            This action cannot be undone. Make sure to backup your data first.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton, isClearing && styles.buttonDisabled]}
            onPress={handleClearData}
            disabled={isClearing}
          >
            {isClearing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <IconSymbol size={20} name="delete-forever" color="#fff" />
            )}
            <Text style={styles.buttonTextPrimary}>
              {isClearing ? 'Clearing...' : 'Clear All Data'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.infoText}>
            ⚠️ This will permanently delete all data. Cannot be undone.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Productivity App</Text>
          <Text style={styles.cardDescription}>
            A personal productivity app for time tracking and task management. 
            All data is stored locally on your device for privacy.
          </Text>
          <Text style={styles.infoText}>
            Version 1.0.0 • Built with React Native & Expo
          </Text>
        </View>
      </View>
    </ScrollView>
  );
} 