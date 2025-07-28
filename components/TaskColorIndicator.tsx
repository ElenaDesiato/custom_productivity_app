import React from 'react';
import { StyleSheet, View } from 'react-native';

interface TaskColorIndicatorProps {
  projectColor: string;
  taskColor?: string;
  size?: number;
}

export function TaskColorIndicator({ projectColor, taskColor, size = 16 }: TaskColorIndicatorProps) {
  // If no task color is set, just show the project color as a full circle
  if (!taskColor) {
    return (
      <View
        style={[
          styles.fullCircle,
          {
            backgroundColor: projectColor,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  // If task color is set, show a half-circle
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Left half - project color */}
      <View
        style={[
          styles.halfCircle,
          styles.leftHalf,
          {
            backgroundColor: projectColor,
            width: size / 2,
            height: size,
            borderTopLeftRadius: size / 2,
            borderBottomLeftRadius: size / 2,
          },
        ]}
      />
      {/* Right half - task color */}
      <View
        style={[
          styles.halfCircle,
          styles.rightHalf,
          {
            backgroundColor: taskColor,
            width: size / 2,
            height: size,
            borderTopRightRadius: size / 2,
            borderBottomRightRadius: size / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fullCircle: {
    // No additional styles needed
  },
  halfCircle: {
    // No additional styles needed
  },
  leftHalf: {
    // No additional styles needed
  },
  rightHalf: {
    // No additional styles needed
  },
}); 