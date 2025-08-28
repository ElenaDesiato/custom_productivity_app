import { Stack } from 'expo-router';

export default function TasksGoalsLayout() {
  return (
    <Stack>
            <Stack.Screen 
              name="index" 
              options={{ 
                title: 'Organization',
                headerShown: true,
              }}  
            />
            <Stack.Screen 
              name="tasks" 
              options={{ 
                title: 'Tasks',
                headerShown: true,
              }} 
            />
            <Stack.Screen 
              name="goals" 
              options={{ 
                title: 'Goals',
                headerShown: true,
              }} 
            />
            <Stack.Screen 
              name="lister" 
              options={{ 
                title: 'Lister',
                headerShown: true,
              }} 
            />
            <Stack.Screen 
              name="progress" 
              options={{ 
                title: 'Progress',
                headerShown: true,
              }} 
            />
            <Stack.Screen 
              name="manageGoals" 
              options={{ 
                title: 'Manage All Goals',
                headerShown: true,
              }} 
            />
            <Stack.Screen 
              name="goalsSettings" 
              options={{ 
                title: 'Goals Settings',
                headerShown: true,
              }} 
            />
            <Stack.Screen 
              name="manageAreas" 
              options={{ 
                title: 'Manage Self-Care Areas',
                headerShown: true,
              }} 
            />
            <Stack.Screen 
              name="weeklyGoals" 
              options={{ 
                title: 'Weekly Goals',
                headerShown: true,
              }} 
            />
        </Stack>
      );
    }
