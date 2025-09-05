import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HealthIndexScreen() {
  const colorScheme = useColorScheme();
  const navigationItems = [
    {
      title: 'Calorie Counting',
      subtitle: 'Track your daily calorie intake',
      icon: 'restaurant',
      route: '/health/calorieCounting',
      color: '#9C27B0', 
    },
    {
      title: 'Weight Tracking',
      subtitle: 'Log and monitor your weight over time',
      icon: 'balance', 
      route: '/health/weightTracking',
      color: '#BA68C8', 
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.subtitle}>
          Take charge of your health by tracking your habits and nutrition
        </ThemedText>
      </View>
      <View style={styles.navigationGrid}>
        {navigationItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navigationCard}
            onPress={() => handleNavigation(item.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}> 
              <IconSymbol name={item.icon} size={24} color="white" />
            </View>
            <View style={styles.cardContent}>
              <ThemedText type="secondary" style={styles.cardTitle}>{item.title}</ThemedText>
              <ThemedText type="secondary" style={styles.cardSubtitle}>{item.subtitle}</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  navigationGrid: {
    flex: 1,
  },
  navigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
