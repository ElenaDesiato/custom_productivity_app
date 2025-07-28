import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function CalendarScreen() {
  return (
    <ThemedView
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
    >
      <ThemedText type="title">Calendar</ThemedText>
      <ThemedText>This feature is coming soon.</ThemedText>
    </ThemedView>
  );
}
