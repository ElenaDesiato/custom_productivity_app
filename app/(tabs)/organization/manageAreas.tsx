import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useGoalsStore } from '@/stores/goalsStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function ManageSelfCareAreasScreen() {
  const areas = useGoalsStore((s) => s.areas);
  const addArea = useGoalsStore((s) => s.addArea);
  const updateArea = useGoalsStore((s) => s.updateArea);
  const deleteArea = useGoalsStore((s) => s.deleteArea);
  const colorScheme = useColorScheme() ?? 'light';
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#2196F3');
  const [newIcon, setNewIcon] = useState('star'); // star is now default
  const [addError, setAddError] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editError, setEditError] = useState('');
  const router = useRouter();

  const handleAdd = async () => {
    if (!newName.trim()) {
      setAddError('Please enter a name for the self-care area.');
      return;
    }
    await addArea({ id: Date.now().toString(), name: newName, color: newColor, icon: newIcon });
    setNewName('');
    setNewColor('#2196F3');
    setNewIcon('star');
    setAddError('');
    setAddModalVisible(false);
  };

  const handleEdit = (area: any) => {
    setEditingId(area.id);
    setEditName(area.name);
    setEditColor(area.color);
    setEditIcon(area.icon);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editName.trim()) {
      setEditError('Please enter a name for the self-care area.');
      return;
    }
    await updateArea({ id: editingId, name: editName, color: editColor, icon: editIcon });
    setEditingId(null);
    setEditError('');
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Area',
      'Are you sure you want to delete this self-care area?\n\nAll goals assigned to this area will also be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteArea(id); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      {/* Add Area Button */}
      <View style={{ marginTop: 18, marginBottom: 18, alignItems: 'flex-start', marginLeft: 16 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#2196F3',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 8,
            marginBottom: 8,
            elevation: 2,
          }}
          onPress={() => setAddModalVisible(true)}
        >
          <IconSymbol name="add" size={22} color="#fff" style={{ marginRight: 8 }} />
          <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add Area</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Add Area Modal */}
      {addModalVisible && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(33,150,243,0.12)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <View style={{
            width: '88%',
            backgroundColor: Colors[colorScheme].background,
            borderRadius: 16,
            padding: 22,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: Colors[colorScheme].tint }}>Add New Self-Care Area</ThemedText>
            <TextInput
              style={{
                backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9',
                borderWidth: 1.5,
                borderColor: Colors[colorScheme].tint,
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                fontSize: 16,
                color: Colors[colorScheme].text,
                marginBottom: 8,
              }}
              placeholder="Area name"
              placeholderTextColor={Colors[colorScheme].tint}
              value={newName}
              onChangeText={text => { setNewName(text); if (addError) setAddError(''); }}
              autoFocus
            />
            {addError ? (
              <ThemedText style={{ color: '#1976D2', marginBottom: 8, fontSize: 14 }}>{addError}</ThemedText>
            ) : null}
            {/* Icon Picker */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <ThemedText style={{ marginRight: 8, color: Colors[colorScheme].tint }}>Icon:</ThemedText>
              {['star','spa','favorite','directions-run','restaurant','water-drop','work','people','person','pets','bedtime','palette','park'].map(icon => (
                <TouchableOpacity key={icon} onPress={() => setNewIcon(icon)} style={{ marginRight: 6, marginBottom: 6, padding: 2, borderRadius: 6, borderWidth: newIcon === icon ? 2 : 0, borderColor: newIcon === icon ? '#1976D2' : 'transparent', backgroundColor: newIcon === icon ? '#E3F2FD' : 'transparent' }}>
                  <IconSymbol name={icon} size={22} color={newIcon === icon ? '#1976D2' : Colors[colorScheme].text} />
                </TouchableOpacity>
              ))}
            </View>
            {/* Color Picker */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <ThemedText style={{ marginRight: 8, color: Colors[colorScheme].tint }}>Color:</ThemedText>
              {['#2196F3','#1976D2','#4CAF50','#388E3C','#FFD600','#FF8A65','#F06292','#9575CD','#A1887F','#E57373','#BA68C8','#00BCD4','#009688','#FFB300','#C2185B','#7B1FA2','#5D4037','#455A64','#F44336','#FFEB3B'].map(color => (
                <TouchableOpacity key={color} onPress={() => setNewColor(color)} style={{
                  width: 26, height: 26, borderRadius: 13, backgroundColor: color, marginRight: 8, marginBottom: 6,
                  borderWidth: newColor === color ? 3 : 1, borderColor: newColor === color ? '#1976D2' : '#ccc',
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  {newColor === color && <IconSymbol name="check" size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
            {/* Close X at top right */}
            <TouchableOpacity onPress={() => { setAddModalVisible(false); setAddError(''); }} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
              <IconSymbol name="close" size={24} color={Colors[colorScheme].tint} />
            </TouchableOpacity>
            {/* Centered Save button */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18 }}>
              <TouchableOpacity onPress={handleAdd} style={{ backgroundColor: '#1976D2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32 }}>
                <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {/* Edit Area Modal */}
      {editingId && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(33,150,243,0.12)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <View style={{
            width: '88%',
            backgroundColor: Colors[colorScheme].background,
            borderRadius: 16,
            padding: 22,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: Colors[colorScheme].tint }}>Edit Self-Care Area</ThemedText>
            <TextInput
              style={{
                backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9',
                borderWidth: 1.5,
                borderColor: Colors[colorScheme].tint,
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                fontSize: 16,
                color: Colors[colorScheme].text,
                marginBottom: 8,
              }}
              placeholder="Area name"
              placeholderTextColor={Colors[colorScheme].tint}
              value={editName}
              onChangeText={text => { setEditName(text); if (editError) setEditError(''); }}
              autoFocus
            />
            {editError ? (
              <ThemedText style={{ color: '#1976D2', marginBottom: 8, fontSize: 14 }}>{editError}</ThemedText>
            ) : null}
            {/* Icon Picker */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <ThemedText style={{ marginRight: 8, color: Colors[colorScheme].tint }}>Icon:</ThemedText>
              {['star','spa','favorite','directions-run','restaurant','water-drop','work','people','person','pets','bedtime','palette','park'].map(icon => (
                <TouchableOpacity key={icon} onPress={() => setEditIcon(icon)} style={{ marginRight: 6, marginBottom: 6, padding: 2, borderRadius: 6, borderWidth: editIcon === icon ? 2 : 0, borderColor: editIcon === icon ? '#1976D2' : 'transparent', backgroundColor: editIcon === icon ? '#E3F2FD' : 'transparent' }}>
                  <IconSymbol name={icon} size={22} color={editIcon === icon ? '#1976D2' : Colors[colorScheme].text} />
                </TouchableOpacity>
              ))}
            </View>
            {/* Color Picker */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <ThemedText style={{ marginRight: 8, color: Colors[colorScheme].tint }}>Color:</ThemedText>
              {['#2196F3','#1976D2','#4CAF50','#388E3C','#FFD600','#FF8A65','#F06292','#9575CD','#A1887F','#E57373','#BA68C8','#00BCD4','#009688','#FFB300','#C2185B','#7B1FA2','#5D4037','#455A64','#F44336','#FFEB3B'].map(color => (
                <TouchableOpacity key={color} onPress={() => setEditColor(color)} style={{
                  width: 26, height: 26, borderRadius: 13, backgroundColor: color, marginRight: 8, marginBottom: 6,
                  borderWidth: editColor === color ? 3 : 1, borderColor: editColor === color ? '#1976D2' : '#ccc',
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  {editColor === color && <IconSymbol name="check" size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
            {/* Close X at top right */}
            <TouchableOpacity onPress={() => { setEditingId(null); setEditError(''); }} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
              <IconSymbol name="close" size={24} color={Colors[colorScheme].tint} />
            </TouchableOpacity>
            {/* Centered Save button */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18 }}>
              <TouchableOpacity onPress={handleSaveEdit} style={{ backgroundColor: '#1976D2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32 }}>
                <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <FlatList
        data={areas}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View style={{
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
            borderLeftColor: item.color || '#4CAF50',
          }}>
            <IconSymbol name={item.icon} size={22} color={item.color} style={{ marginRight: 10 }} />
            <ThemedText type="secondary" style={{ flex: 1, color: Colors[colorScheme].textSecondary, fontSize: 16, fontWeight: '500' }}>{item.name}</ThemedText>
            <TouchableOpacity style={{ marginLeft: 8, marginRight: 16 }} onPress={() => handleEdit(item)}>
              <IconSymbol name="edit" size={20} color={Colors[colorScheme].textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => handleDelete(item.id)}>
              <IconSymbol name="delete" size={20} color="#e53935" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    flex: 1,
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
  },
  editButton: {
    marginLeft: 8,
  },
  deleteButton: {
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  cancelButton: {
    marginLeft: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
});
