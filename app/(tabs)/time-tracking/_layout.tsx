import { Stack } from 'expo-router';
import React from 'react';

export default function TimeTrackingLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Time Tracking',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="timer" 
        options={{ 
          title: 'Timer',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="tasks" 
        options={{ 
          title: 'Tasks & Projects',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="timesheet" 
        options={{ 
          title: 'Timesheet',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="reports" 
        options={{ 
          title: 'Reports',
          headerShown: true,
        }} 
      />
    </Stack>
  );
} 