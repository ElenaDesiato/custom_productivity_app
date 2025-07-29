import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function CalendarScreen() {
  const backgroundColor = useThemeColor({}, "background");
  const cardBackgroundColor = "#F5F5F5";

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: "#FF9800" }]}>
          <IconSymbol name="calendar" size={48} color="white" />
        </View>
        
        <ThemedText type="title" style={styles.title}>
          Calendar
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.subtitle}>
          Plan your schedule and manage events
        </ThemedText>
        
        <View style={[styles.featureCard, { backgroundColor: cardBackgroundColor }]}>
          <ThemedText type="secondary" style={styles.comingSoonText}>
            Coming Soon
          </ThemedText>
          <ThemedText type="secondary" style={styles.description}>
            We're building a comprehensive calendar feature. You'll be able to schedule events, set reminders, and view your productivity timeline.
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 32,
    textAlign: "center",
  },
  featureCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    maxWidth: 300,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    opacity: 0.8,
  },
});
