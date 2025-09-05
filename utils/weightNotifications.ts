
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyWeightReminder(hour: number, minute: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to weigh yourself!',
      body: 'Don\'t forget to log your weight today.',
    },
    trigger: {
      hour,
      minute,
      type: SchedulableTriggerInputTypes.DAILY,
    },
  });
}

export async function cancelWeightReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
