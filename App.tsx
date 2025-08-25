import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootLayout from './app/_layout';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayout />
    </GestureHandlerRootView>
  );
}
