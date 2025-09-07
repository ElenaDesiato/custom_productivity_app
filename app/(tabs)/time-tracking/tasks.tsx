import { TaskColorIndicator } from '@/components/TaskColorIndicator';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTimeTrackingStore } from '@/stores/timeTrackingStore';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const PROJECT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Blue
  '#96CEB4', // Mint
  '#FFEAA7', // Yellow
  '#DDA0DD', // Lavender
  '#98D8C8', // Aqua
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
  '#FFB347', // Orange
  '#B0E57C', // Light Green
  '#FF69B4', // Pink
  '#A569BD', // Deep Purple
  '#34495E', // Dark Blue
  '#00B894', // Teal
  '#00CEC9', // Cyan
  '#FD7272', // Coral
  '#636e72', // Gray
  '#fdcb6e', // Gold
];


export default function TasksScreen() {
  const colorScheme = useColorScheme();
  // Zustand selectors
  const projects = useTimeTrackingStore(s => s.projects);
  const tasks = useTimeTrackingStore(s => s.tasks);
  const addProject = useTimeTrackingStore(s => s.addProject);
  const updateProject = useTimeTrackingStore(s => s.updateProject);
  const deleteProject = useTimeTrackingStore(s => s.deleteProject);
  const addTask = useTimeTrackingStore(s => s.addTask);
  const updateTask = useTimeTrackingStore(s => s.updateTask);
  const deleteTask = useTimeTrackingStore(s => s.deleteTask);
  const getTasksByProject = useTimeTrackingStore(s => s.getTasksByProject);
  const loadData = useTimeTrackingStore(s => s.loadData);

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [selectedTaskColor, setSelectedTaskColor] = useState<string | undefined>(undefined);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Please enter a project name.');
      return;
    }
    await addProject(newProjectName.trim(), selectedColor);
    setNewProjectName('');
    setSelectedColor(PROJECT_COLORS[0]);
    setShowProjectModal(false);
  };

  const handleEditProject = async () => {
    if (!editingProject || !newProjectName.trim()) {
      Alert.alert('Error', 'Please enter a project name.');
      return;
    }
    await updateProject(editingProject.id, { name: newProjectName.trim(), color: selectedColor });
    setEditingProject(null);
    setNewProjectName('');
    setSelectedColor(PROJECT_COLORS[0]);
    setShowProjectModal(false);
  };

  const handleDeleteProject = (project: any) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This will also delete all tasks in this project.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProject(project.id) },
      ]
    );
  };

  const handleCreateTask = async () => {
    if (!newTaskName.trim()) {
      Alert.alert('Error', 'Please enter a task name.');
      return;
    }
    if (!selectedProjectId) {
      Alert.alert('Missing Project', 'Please select a project for this task.');
      return;
    }
    await addTask(newTaskName.trim(), selectedProjectId, selectedTaskColor);
    setNewTaskName('');
    setSelectedProjectId('');
    setSelectedTaskColor(undefined);
    setShowTaskModal(false);
  };

  const handleEditTask = async () => {
    if (!editingTask || !newTaskName.trim()) {
      Alert.alert('Error', 'Please enter a task name.');
      return;
    }
    await updateTask(editingTask.id, { name: newTaskName.trim(), color: selectedTaskColor });
    setEditingTask(null);
    setNewTaskName('');
    setSelectedTaskColor(undefined);
    setShowTaskModal(false);
  };

  const handleDeleteTask = (task: any) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
      ]
    );
  };

  const openProjectModal = (project?: any) => {
    if (project) {
      setEditingProject(project);
      setNewProjectName(project.name);
      setSelectedColor(project.color);
    } else {
      setEditingProject(null);
      setNewProjectName('');
      setSelectedColor(PROJECT_COLORS[0]);
    }
    setShowProjectModal(true);
  };

  const openTaskModal = (task?: any) => {
    if (task) {
      setEditingTask(task);
      setNewTaskName(task.name);
      setSelectedProjectId(task.projectId);
      setSelectedTaskColor(task.color);
    } else {
      setEditingTask(null);
      setNewTaskName('');
      setSelectedProjectId('');
      setSelectedTaskColor(undefined);
    }
    setShowTaskModal(true);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content}>
        {projects.map(project => {
          const projectTasks = getTasksByProject(project.id);
          return (
            <View key={project.id} style={styles.projectCard}>
              <View style={styles.projectHeader}>
                <View style={styles.projectInfo}>
                  <View style={[styles.projectColor, { backgroundColor: project.color }]} />
                  <ThemedText type="secondary" style={styles.projectName}>{project.name}</ThemedText>
                  <ThemedText type="secondary" style={styles.taskCount}>
                    {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
                <View style={styles.projectActions}>
                  <TouchableOpacity
                    onPress={() => openProjectModal(project)}
                    style={styles.actionButton}
                  >
                    <IconSymbol name="edit" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteProject(project)}
                    style={styles.actionButton}
                  >
                    <IconSymbol name="delete" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.taskList}>
                {projectTasks.map(task => (
                  <View key={task.id} style={styles.taskItem}>
                    <View style={styles.taskInfo}>
                      <TaskColorIndicator
                        projectColor={project.color}
                        taskColor={task.color}
                        size={16}
                      />
                      <ThemedText type="secondary" style={styles.taskName}>{task.name}</ThemedText>
                    </View>
                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        onPress={() => openTaskModal(task)}
                        style={styles.actionButton}
                      >
                        <IconSymbol name="edit" size={14} color="#4CAF50" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteTask(task)}
                        style={styles.actionButton}
                      >
                        <IconSymbol name="delete" size={14} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={() => {
                    setSelectedProjectId(project.id);
                    openTaskModal();
                  }}
                >
                  <IconSymbol name="add" size={16} color={Colors[colorScheme ?? 'light'].text} />
                  <ThemedText type="secondary" style={styles.addTaskText}>Add Task</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {projects.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="folder" size={48} color={Colors[colorScheme ?? 'light'].text} />
            <ThemedText style={styles.emptyTitle}>No Projects Yet</ThemedText>
            <ThemedText style={styles.emptyText}>
              Create your first project to get started with time tracking.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Add Project Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openProjectModal()}
      >
        <IconSymbol name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Project Modal */}
      <Modal visible={showProjectModal} animationType="slide" transparent onRequestClose={() => setShowProjectModal(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { backgroundColor: colorScheme === 'dark' ? '#22292f' : '#fff' }] }>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#fff' : '#222' }]}>{editingProject ? 'Edit Project' : 'New Project'}</ThemedText>
              <TouchableOpacity onPress={() => setShowProjectModal(false)} style={styles.closeButton}>
                <IconSymbol name="close" size={24} color={colorScheme === 'dark' ? '#fff' : '#222'} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={[styles.input, { color: colorScheme === 'dark' ? '#fff' : '#222', borderColor: '#4CAF50', backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
                placeholder="Project name"
                value={newProjectName}
                onChangeText={setNewProjectName}
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
                autoFocus
              />
              <ThemedText style={{ marginBottom: 8, color: colorScheme === 'dark' ? '#fff' : '#222' }}>Pick a color:</ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {PROJECT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: color,
                      marginRight: 8,
                      marginBottom: 8,
                      borderWidth: selectedColor === color ? 3 : 1,
                      borderColor: selectedColor === color ? '#4CAF50' : '#ccc',
                    }}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={editingProject ? handleEditProject : handleCreateProject}>
                <ThemedText style={styles.saveButtonText}>{editingProject ? 'Update Project' : 'Create Project'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Modal */}
      <Modal visible={showTaskModal} animationType="slide" transparent onRequestClose={() => setShowTaskModal(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { backgroundColor: colorScheme === 'dark' ? '#22292f' : '#fff' }] }>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#fff' : '#222' }]}>{editingTask ? 'Edit Task' : 'New Task'}</ThemedText>
              <TouchableOpacity onPress={() => setShowTaskModal(false)} style={styles.closeButton}>
                <IconSymbol name="close" size={24} color={colorScheme === 'dark' ? '#fff' : '#222'} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={[styles.input, { color: colorScheme === 'dark' ? '#fff' : '#222', borderColor: '#4CAF50', backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
                placeholder="Task name"
                value={newTaskName}
                onChangeText={setNewTaskName}
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
                autoFocus
              />
              {!editingTask && (
                <>
                  <ThemedText style={{ marginBottom: 8, color: colorScheme === 'dark' ? '#fff' : '#222' }}>Select project:</ThemedText>
                  <ScrollView style={styles.projectSelector}>
                    {projects.map(project => (
                      <TouchableOpacity
                        key={project.id}
                        style={[styles.projectOption, selectedProjectId === project.id && styles.selectedProject]}
                        onPress={() => setSelectedProjectId(project.id)}
                      >
                        <View style={[styles.projectDot, { backgroundColor: project.color }]} />
                        <ThemedText
                          type="default"
                          style={[styles.projectOptionText, selectedProjectId === project.id && { color: Colors[colorScheme ?? 'light'].textSecondary }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {project.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
              <ThemedText style={{ marginBottom: 8, color: colorScheme === 'dark' ? '#fff' : '#222' }}>Task color (optional):</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <TaskColorIndicator
                  projectColor={editingTask ? (projects.find(p => p.id === editingTask.projectId)?.color || PROJECT_COLORS[0]) : (selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.color || PROJECT_COLORS[0] : '#000000')}
                  taskColor={selectedTaskColor}
                  size={24}
                />
                <ThemedText type="secondary" style={{ marginLeft: 12, fontSize: 14 }}>
                  {selectedTaskColor ? 'Custom color' : 'Project color'}
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                <TouchableOpacity
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: 'transparent',
                    marginRight: 8,
                    marginBottom: 8,
                    borderWidth: !selectedTaskColor ? 3 : 1,
                    borderColor: !selectedTaskColor ? '#4CAF50' : '#ccc',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => setSelectedTaskColor(undefined)}
                >
                  <ThemedText style={{ fontSize: 10, color: colorScheme === 'dark' ? '#fff' : '#222', textAlign: 'center', lineHeight: 28 }}>{editingTask ? 'N/A' : 'None'}</ThemedText>
                </TouchableOpacity>
                {PROJECT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedTaskColor(color)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: color,
                      marginRight: 8,
                      marginBottom: 8,
                      borderWidth: selectedTaskColor === color ? 3 : 1,
                      borderColor: selectedTaskColor === color ? '#4CAF50' : '#ccc',
                    }}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={editingTask ? handleEditTask : handleCreateTask}>
                <ThemedText style={styles.saveButtonText}>{editingTask ? 'Update Task' : 'Create Task'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  projectCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  taskCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  projectActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  taskList: {
    marginTop: 8,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  taskActions: {
    flexDirection: 'row',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 8,
  },
  addTaskText: {
    marginLeft: 8,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
  padding: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
  },
  selectedColor: {
    borderWidth: 3,
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorPreviewText: {
    marginLeft: 12,
    fontSize: 14,
  },
  colorOptionText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    lineHeight: 30,
  },
  projectLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  projectSelector: {
    maxHeight: 200,
    marginBottom: 20,
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedProject: {
    backgroundColor: '#E3F2FD',
  },
  projectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  projectOptionText: {
    fontSize: 16,
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0,
    maxWidth: 200, // allow up to ~15 chars before truncation
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal background style for overlay
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal container style for rounded corners and padding
  modalContainer: {
  minWidth: 320,
  borderRadius: 18,
  padding: 20,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 8,
  },
});