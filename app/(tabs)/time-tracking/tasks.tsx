import { TaskColorIndicator } from '@/components/TaskColorIndicator';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const PROJECT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const {
    projects,
    tasks,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    getTasksByProject,
    loadData,
  } = useTimeTracking();

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
                    <IconSymbol name="edit" size={16} color={Colors[colorScheme ?? 'light'].textSecondary} />
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
                        <IconSymbol name="edit" size={14} color={Colors[colorScheme ?? 'light'].textSecondary} />
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
      <Modal
        visible={showProjectModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              {editingProject ? 'Edit Project' : 'New Project'}
            </ThemedText>
            <TouchableOpacity
              onPress={() => setShowProjectModal(false)}
              style={styles.closeButton}
            >
              <IconSymbol name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Project name"
              value={newProjectName}
              onChangeText={setNewProjectName}
              placeholderTextColor={Colors[colorScheme ?? 'light'].text}
            />

            <ThemedText style={styles.colorLabel}>Choose color:</ThemedText>
            <View style={styles.colorGrid}>
              {PROJECT_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && [styles.selectedColor, { borderColor: Colors[colorScheme ?? 'light'].tint }],
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={editingProject ? handleEditProject : handleCreateProject}
            >
              <ThemedText style={styles.saveButtonText}>
                {editingProject ? 'Update Project' : 'Create Project'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Modal>

      {/* Task Modal */}
      <Modal
        visible={showTaskModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </ThemedText>
            <TouchableOpacity
              onPress={() => setShowTaskModal(false)}
              style={styles.closeButton}
            >
              <IconSymbol name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Task name"
              value={newTaskName}
              onChangeText={setNewTaskName}
              placeholderTextColor={Colors[colorScheme ?? 'light'].text}
            />

            {editingTask && (
              <>
                <ThemedText style={styles.colorLabel}>Task color (optional):</ThemedText>
                <View style={styles.colorPreview}>
                  <TaskColorIndicator
                    projectColor={projects.find(p => p.id === editingTask.projectId)?.color || PROJECT_COLORS[0]}
                    taskColor={selectedTaskColor}
                    size={24}
                  />
                  <ThemedText type="secondary" style={styles.colorPreviewText}>
                    {selectedTaskColor ? 'Custom color' : 'Project color'}
                  </ThemedText>
                </View>
                <View style={styles.colorGrid}>
                  <TouchableOpacity
                    style={[
                      styles.colorOption,
                      { backgroundColor: 'transparent' },
                      !selectedTaskColor && { borderWidth: 2, borderColor: '#E0E0E0' },
                      !selectedTaskColor && [styles.selectedColor, { borderColor: Colors[colorScheme ?? 'light'].tint }],
                    ]}
                    onPress={() => setSelectedTaskColor(undefined)}
                  >
                    <ThemedText style={[styles.colorOptionText, { color: Colors[colorScheme ?? 'light'].text }]}>None</ThemedText>
                  </TouchableOpacity>
                  {PROJECT_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedTaskColor === color && [styles.selectedColor, { borderColor: Colors[colorScheme ?? 'light'].tint }],
                      ]}
                      onPress={() => setSelectedTaskColor(color)}
                    />
                  ))}
                </View>
              </>
            )}

            {!editingTask && (
              <>
                <ThemedText style={[styles.projectLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Select project:</ThemedText>
                <ScrollView style={styles.projectSelector}>
                  {projects.map(project => (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.projectOption,
                        selectedProjectId === project.id && styles.selectedProject,
                      ]}
                      onPress={() => setSelectedProjectId(project.id)}
                    >
                      <View style={[styles.projectDot, { backgroundColor: project.color }]} />
                      <ThemedText
                        type="default"
                        style={[
                          styles.projectOptionText,
                          selectedProjectId === project.id && { color: Colors[colorScheme ?? 'light'].textSecondary },
                        ]}
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

            {!editingTask && (
              <>
                <ThemedText style={styles.colorLabel}>Task color (optional):</ThemedText>
                <View style={styles.colorPreview}>
                  <TaskColorIndicator
                    projectColor={selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.color || PROJECT_COLORS[0] : '#000000'}
                    taskColor={selectedTaskColor}
                    size={24}
                  />
                  <ThemedText style={styles.colorPreviewText}>
                    {selectedTaskColor ? 'Custom color' : 'Project color'}
                  </ThemedText>
                </View>
                <View style={styles.colorGrid}>
                  <TouchableOpacity
                    style={[
                      styles.colorOption,
                      { backgroundColor: 'transparent' },
                      !selectedTaskColor && { borderWidth: 2, borderColor: '#E0E0E0' },
                      !selectedTaskColor && [styles.selectedColor, { borderColor: Colors[colorScheme ?? 'light'].tint }],
                    ]}
                    onPress={() => setSelectedTaskColor(undefined)}
                  >
                    <ThemedText style={[styles.colorOptionText, { color: Colors[colorScheme ?? 'light'].text }]}>None</ThemedText>
                  </TouchableOpacity>
                  {PROJECT_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedTaskColor === color && [styles.selectedColor, { borderColor: Colors[colorScheme ?? 'light'].tint }],
                      ]}
                      onPress={() => setSelectedTaskColor(color)}
                    />
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={editingTask ? handleEditTask : handleCreateTask}
            >
              <ThemedText style={styles.saveButtonText}>
                {editingTask ? 'Update Task' : 'Create Task'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
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
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 20,
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
}); 