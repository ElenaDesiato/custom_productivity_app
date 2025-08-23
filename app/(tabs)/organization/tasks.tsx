
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOrganization } from '@/hooks/useOrganization';
import { Task, TaskList } from '@/types/organization';
import React from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';


const COLORS = [
  '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#607D8B',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const themeBg = Colors[colorScheme ?? 'light'].background;
  const themeText = Colors[colorScheme ?? 'light'].text;
  const { tasks, setTasks, lists, setLists } = useOrganization();
  const [showListModal, setShowListModal] = React.useState(false);
  const [newListName, setNewListName] = React.useState('');
  const [newListColor, setNewListColor] = React.useState(COLORS[0]);
  const [showTaskModal, setShowTaskModal] = React.useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [selectedListId, setSelectedListId] = React.useState<string | null>(null);
  const [newTaskName, setNewTaskName] = React.useState('');
  const [newTaskDetails, setNewTaskDetails] = React.useState('');
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);
  // For editing lists
  const [editingList, setEditingList] = React.useState<TaskList | null>(null);

  // --- Task Edit Modal Functions ---
  function openEditTaskModal(task: Task) {
    setSelectedTask(null);
    setEditingTask(task);
    setNewTaskName(task.name);
    setNewTaskDetails(task.details || '');
    setSelectedListId(task.listId);
    setShowEditTaskModal(true);
  }

  function handleSaveEditTask() {
    if (!editingTask) return;
    if (!newTaskName.trim()) {
      Alert.alert('Missing Task Name', 'Please enter a name for your task.');
      return;
    }
    setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, name: newTaskName.trim(), details: newTaskDetails.trim(), listId: selectedListId || t.listId } : t));
    setEditingTask(null);
    setShowEditTaskModal(false);
    setNewTaskName('');
    setNewTaskDetails('');
    setSelectedListId(null);
  }

  const handleEditList = () => {
    if (!editingList || !newListName.trim()) return;
    setLists(lists.map(l => l.id === editingList.id ? { ...l, name: newListName.trim(), color: newListColor } : l));
    setEditingList(null);
    setNewListName('');
    setNewListColor(COLORS[0]);
    setShowListModal(false);
  };
  const handleDeleteList = (listId: string) => {
    setLists(lists.filter(l => l.id !== listId));
    setTasks(tasks.map(t => {
      if (t.listId === listId && t.archived) {
        return {
          ...t,
          listId: `deleted-${listId}`,
          deletedList: true,
        };
      } else if (t.listId === listId) {
        // Only remove non-archived tasks
        return null;
      }
      return t;
    }).filter(Boolean) as Task[]);
  };
  const openEditListModal = (list: TaskList) => {
    setEditingList(list);
    setNewListName(list.name);
    setNewListColor(list.color);
    setShowListModal(true);
  };

  // Add a new list
  // Generate a unique ID (safe for Expo/React Native)
  function getRandomId() {
    return Date.now().toString() + Math.floor(Math.random() * 10000).toString();
  }
  const handleAddList = () => {
    if (!newListName.trim()) return;
    setLists([...lists, { id: getRandomId(), name: newListName.trim(), color: newListColor }]);
    setNewListName('');
    setNewListColor(COLORS[0]);
    setShowListModal(false);
  };

  // Add a new task
  const handleAddTask = () => {
    if (!newTaskName.trim()) {
      Alert.alert('Missing Task Name', 'Please enter a name for your task.');
      return;
    }
    if (!selectedListId) return;
    setTasks([
      ...tasks,
      { id: getRandomId(), name: newTaskName.trim(), details: newTaskDetails.trim(), listId: selectedListId, completed: false, archived: false }
    ]);
    setNewTaskName('');
    setNewTaskDetails('');
    setShowTaskModal(false);
  };

  // Complete a task
  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(t =>
      t.id === taskId
        ? { ...t, completed: true, archived: true, completedAt: new Date().toISOString() }
        : t
    ));
    setSelectedTask(null);
  };

  // Delete a task
  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setSelectedTask(null);
  };

  // Show archived tasks, sorted by completedAt descending
  const archivedTasks = tasks
    .filter(t => t.archived)
    .slice()
    .sort((a, b) => {
      if (!a.completedAt && !b.completedAt) return 0;
      if (!a.completedAt) return 1;
      if (!b.completedAt) return -1;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    });

  // Render a single task in a list
  const renderTaskItem = (task: Task) => (
    <View key={task.id} style={styles.taskRow}>
      <TouchableOpacity
        onPress={() => handleCompleteTask(task.id)}
        style={{ marginRight: 0 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={[styles.checkbox, { borderColor: getListColor(task.listId), backgroundColor: task.completed ? getListColor(task.listId) : 'transparent' }]}
          >
          {task.completed && <View style={styles.checkboxInner} />}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedTask(task)}>
        <ThemedText type="secondary" style={[styles.taskName, { minWidth: 70, marginLeft: 10 }]}>{task.name}</ThemedText>
      </TouchableOpacity>
    </View>
  );

  // Get color for a list
  function getListColor(listId: string) {
    // If the list was deleted, return light gray
    if (listId.startsWith('deleted-')) return '#ccc';
    return lists.find(l => l.id === listId)?.color || '#ccc';
  }

  // Render a single list with its tasks
  const renderList = ({ item: list }: { item: TaskList }) => (
    <View style={styles.listCard}>
      <View style={[styles.listHeader, { backgroundColor: list.color }]}> 
        <View style={styles.listHeaderLeft}>
          <ThemedText style={styles.listTitle}>{list.name}</ThemedText>
        </View>
        <View style={styles.listHeaderActions}>
          <TouchableOpacity onPress={() => { setSelectedListId(list.id); setShowTaskModal(true); }} style={styles.iconBtn}>
            <IconSymbol name="add" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openEditListModal(list)} style={styles.iconBtn}>
            <IconSymbol name="edit" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteList(list.id)} style={styles.iconBtn}>
            <IconSymbol name="delete" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {tasks.filter(t => t.listId === list.id && !t.archived).length === 0 ? (
        <ThemedText style={styles.emptyText}>No tasks yet.</ThemedText>
      ) : (
        tasks.filter(t => t.listId === list.id && !t.archived).map(renderTaskItem)
      )}
    </View>
  );

  // Render archived tasks
  const renderArchivedTask = (task: Task) => {
    let listName = lists.find(l => l.id === task.listId)?.name;
    if (!listName && task.deletedList) {
      listName = 'Deleted List';
    }
    return (
      <View key={task.id} style={styles.archivedTaskRow}>
        <View style={[styles.checkbox, { borderColor: getListColor(task.listId), backgroundColor: getListColor(task.listId) }]} />
        <ThemedText style={styles.taskName}>{task.name}</ThemedText>
        <ThemedText style={[styles.archivedListName, { color: getListColor(task.listId) }]}>{listName}</ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        {!showArchived ? (
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setShowArchived(true)}>
            <IconSymbol name="archive" size={22} color={themeText} />
            <ThemedText style={[styles.archivedBtn, { marginLeft: 8 }]}>Archived Tasks</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setShowArchived(false)}>
            <IconSymbol name="arrow-back" size={22} color={themeText} />
            <ThemedText style={[styles.archivedBtn, { marginLeft: 8 }]}>Lists</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {!showArchived ? (
        <ScrollView style={{ flex: 1 }}>
          {lists.length === 0 ? (
            <ThemedText style={styles.emptyText}>No lists yet.</ThemedText>
          ) : (
            lists.filter(list => list && typeof list === 'object' && 'id' in list && 'name' in list && 'color' in list).map(list => (
              <React.Fragment key={list.id}>{renderList({ item: list })}</React.Fragment>
            ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      ) : (
        <>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <ThemedText style={{ fontSize: 28, fontWeight: 'bold', color: themeText, opacity: 0.7 }}>Archived</ThemedText>
          </View>
          <FlatList
            data={archivedTasks}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedTask(item)}>
                {renderArchivedTask(item)}
              </TouchableOpacity>
            )}
            keyExtractor={t => t.id}
            ListEmptyComponent={<ThemedText style={styles.emptyText}>No archived tasks.</ThemedText>}
          />
        </>
      )}

      {/* Floating Action Button for Add List (hide in archived view) */}
      {!showArchived && (
        <TouchableOpacity style={styles.fab} onPress={() => { setEditingList(null); setShowListModal(true); }}>
          <IconSymbol name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* List Modal */}
      <Modal visible={showListModal} animationType="slide" transparent>
        <View style={[styles.modalBg, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.2)' }] }>
          <View style={[styles.modalContainer, { backgroundColor: themeBg }] }>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: themeText }]}>{editingList ? 'Edit List' : 'New List'}</ThemedText>
              <TouchableOpacity onPress={() => { setEditingList(null); setShowListModal(false); }} style={styles.closeButton}>
                <IconSymbol name="close" size={24} color={themeText} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                placeholder="List name"
                value={newListName}
                onChangeText={setNewListName}
                style={[styles.input, { color: themeText, borderColor: '#2196F3', backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
              />
              <ThemedText style={[styles.colorLabel, { color: themeText }]}>Choose color:</ThemedText>
              <View style={styles.colorGrid}>
                {COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      newListColor === c && styles.selectedColor,
                    ]}
                    onPress={() => setNewListColor(c)}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={editingList ? handleEditList : handleAddList}>
                <ThemedText style={styles.saveButtonText}>{editingList ? 'Save Changes' : 'Add List'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Details Modal */}
      <Modal visible={!!selectedTask} transparent animationType="slide">
        <View style={styles.modalBg}>
          {selectedTask && (
            <View style={[styles.modalCard, { backgroundColor: '#fff' }] }>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <ThemedText type="secondary" style={[styles.modalTitle, { flex: 1 }]} numberOfLines={2}>{selectedTask.name}</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => handleDeleteTask(selectedTask.id)} style={styles.closeButton}>
                    <IconSymbol name="delete" size={22} color="#E53935" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEditTaskModal(selectedTask)} style={styles.closeButton}>
                    <IconSymbol name="edit" size={22} color={Colors[colorScheme ?? 'light'].textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedTask(null)} style={styles.closeButton}>
                    <IconSymbol name="close" size={24} color={Colors[colorScheme ?? 'light'].textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <ThemedText type="secondary" style={{ fontWeight: '600', marginBottom: 4, color: lists.find(l => l.id === selectedTask.listId)?.color || '#888' }}>
                {lists.find(l => l.id === selectedTask.listId)?.name || 'Unknown List'}
              </ThemedText>
              {selectedTask.details ? (
                <ThemedText type="secondary" style={[styles.modalDetails, { marginBottom: 12, fontStyle: 'italic' }]}>{selectedTask.details}</ThemedText>
              ) : (
                <ThemedText type="secondary" style={[styles.modalDetails, { fontStyle: 'italic', marginBottom: 12 }]}>No details</ThemedText>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => {
                    if (showArchived && selectedTask?.archived) {
                      // Unarchive
                      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, completed: false, archived: false } : t));
                      setSelectedTask(null);
                    } else {
                      handleCompleteTask(selectedTask.id);
                    }
                  }}
                >
                  <View style={[styles.checkbox, { borderColor: getListColor(selectedTask.listId), backgroundColor: selectedTask.completed ? getListColor(selectedTask.listId) : 'transparent' }]}
                  >
                    {selectedTask.completed && <View style={styles.checkboxInner} />}
                  </View>
                </TouchableOpacity>
                <ThemedText type="secondary" style={[styles.detailsLabel, { minWidth: 70, marginLeft: 10 }]}>Complete</ThemedText>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Task Modal */}
      <Modal visible={showTaskModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: themeBg }] }>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ThemedText style={styles.modalTitle}>New Task</ThemedText>
              <TouchableOpacity onPress={() => setShowTaskModal(false)} style={styles.closeButton}>
                <IconSymbol name="close" size={24} color={themeText} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Task name"
              value={newTaskName}
              onChangeText={setNewTaskName}
              style={[styles.input, { color: themeText, backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
            />
            <TextInput
              placeholder="Details (optional)"
              value={newTaskDetails}
              onChangeText={setNewTaskDetails}
              style={[styles.input, { height: 60, color: themeText, backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
              multiline
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleAddTask}>
              <ThemedText style={styles.modalBtnText}>Add Task</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Task Modal */}
      <Modal visible={showEditTaskModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: themeBg }] }>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ThemedText style={styles.modalTitle}>Edit Task</ThemedText>
              <TouchableOpacity onPress={() => { setShowEditTaskModal(false); setEditingTask(null); }} style={styles.closeButton}>
                <IconSymbol name="close" size={24} color={themeText} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Task name"
              value={newTaskName}
              onChangeText={setNewTaskName}
              style={[styles.input, { color: themeText, backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
            />
            <TextInput
              placeholder="Details (optional)"
              value={newTaskDetails}
              onChangeText={setNewTaskDetails}
              style={[styles.input, { height: 60, color: themeText, backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
              multiline
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleSaveEditTask}>
              <ThemedText style={styles.modalBtnText}>Save Changes</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, width: '90%', elevation: 6, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  closeButton: { padding: 8 },
  modalContent: { padding: 20 },
  colorLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  colorOption: { width: 40, height: 40, borderRadius: 20, margin: 4, borderWidth: 2, borderColor: 'transparent' },
  selectedColor: { borderColor: '#2196F3', borderWidth: 3 },
  saveButton: { backgroundColor: '#2196F3', borderRadius: 8, padding: 16, marginTop: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', flex: 1 },
  addListBtn: { color: '#2196F3', fontWeight: 'bold', marginHorizontal: 8 },
  archivedBtn: { color: '#607D8B', fontWeight: 'bold' },
  listCard: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 16, padding: 0, overflow: 'hidden', elevation: 2 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  listTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  addTaskBtn: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyText: { color: '#888', textAlign: 'center', marginVertical: 16 },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  taskName: { marginLeft: 12, fontSize: 15, flex: 1 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  checkboxInner: { width: 12, height: 12, backgroundColor: '#22292f', borderRadius: 2 },
  archivedTaskRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  archivedListName: { marginLeft: 12, fontSize: 13, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '85%', elevation: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modalDetails: { fontSize: 15, color: '#555', marginBottom: 16 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  detailsLabel: { marginLeft: 8, fontSize: 15 },
  deleteBtn: { backgroundColor: '#E91E63', borderRadius: 6, padding: 10, marginBottom: 8 },
  deleteBtnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  modalBtn: { backgroundColor: '#2196F3', borderRadius: 6, padding: 10, marginTop: 12 },
  modalBtnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  modalCancel: { marginTop: 8, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 12, fontSize: 15, backgroundColor: '#f9f9f9' },
  colorRow: { flexDirection: 'row', marginBottom: 12 },
  colorCircle: { width: 28, height: 28, borderRadius: 14, marginRight: 8, borderColor: '#22292f' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  listHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listHeaderActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginLeft: 8, padding: 4 },
});
