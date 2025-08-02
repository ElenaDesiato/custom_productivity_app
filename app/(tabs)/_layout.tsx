import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="time-tracking"
        options={{
          title: "Time Tracking",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="hourglass-empty" color={Colors[colorScheme ?? "light"].textSecondary} />
          ), // Use an hourglass icon
        }}
      />
      <Tabs.Screen
        name="todo-list"
        options={{
          title: "Todo List",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="checkmark.circle" color={Colors[colorScheme ?? "light"].textSecondary} />
          ), // Use a checkmark.circle icon
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={Colors[colorScheme ?? "light"].textSecondary} />
          ), // Use a calendar icon
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="tune" color={Colors[colorScheme ?? "light"].textSecondary} />
          ),
        }}
      />
    </Tabs>
  );
}
