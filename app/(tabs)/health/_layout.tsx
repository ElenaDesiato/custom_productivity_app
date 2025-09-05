import { Stack } from 'expo-router';
import React from 'react';

export default function HealthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Health',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="calorieCounting"
        options={{
          title: 'Calorie Counting',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="weightTracking"
        options={{
          title: 'Weight Tracking',
          headerShown: true,
        }}
      />
    </Stack>
  );
}