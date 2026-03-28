import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { isLoopCompletedToday } from "../utils/loopMetrics";

export const DAILY_LOOP_REMINDER_CHANNEL_ID = "daily-loop-reminders";
export const DAILY_LOOP_REMINDER_ID = "loopify-daily-loop-reminder";
export const DAILY_LOOP_REMINDER_KIND = "daily-loop-reminder";
export const DEFAULT_REMINDER_TIME = "20:00";

export const MOTIVATION_MESSAGES = [
  "Your future self will thank you for showing up today.",
  "Small loop, big momentum. Start now.",
  "One completed loop can change the tone of your whole day.",
  "Progress beats perfect. Knock out your next loop.",
  "You do not need a perfect mood to take one solid step.",
  "Keep the streak alive. Your loops are waiting.",
  "A few focused minutes now will feel great later.",
  "Today still counts. Give your goals a quick win.",
  "You are closer than you think. Finish one more loop.",
  "Build the habit, trust the rhythm, and keep moving.",
  "Your goals need action, not pressure. Start with one loop.",
  "Momentum grows when you return, even after a slow start.",
  "The best time for your next loop is this moment.",
  "You already started this journey. Keep it alive today.",
  "A strong day can begin with one simple completion.",
];

let hasConfiguredHandler = false;
let hasConfiguredChannel = false;
let hasWarnedUnavailable = false;
let cachedNotificationsModule;

function getNotificationsModule() {
  if (Platform.OS === "web") {
    return null;
  }

  if (cachedNotificationsModule !== undefined) {
    return cachedNotificationsModule;
  }

  const hasPushTokenManager = !!requireOptionalNativeModule("ExpoPushTokenManager");
  const hasNotificationScheduler = !!requireOptionalNativeModule("ExpoNotificationScheduler");

  if (!hasPushTokenManager || !hasNotificationScheduler) {
    cachedNotificationsModule = null;

    if (!hasWarnedUnavailable) {
      console.warn(
        "expo-notifications native module is unavailable. Rebuild the app/dev client before using Loopify reminders."
      );
      hasWarnedUnavailable = true;
    }

    return cachedNotificationsModule;
  }

  try {
    cachedNotificationsModule = require("expo-notifications");
  } catch (error) {
    cachedNotificationsModule = null;

    if (!hasWarnedUnavailable) {
      console.warn("Failed to load expo-notifications:", error?.message || error);
      hasWarnedUnavailable = true;
    }
  }

  return cachedNotificationsModule;
}

function parseReminderTime(reminderTime = DEFAULT_REMINDER_TIME) {
  const [rawHour, rawMinute] = String(reminderTime).split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return { hour: 20, minute: 0 };
  }

  return { hour, minute };
}

function getNextTriggerDate(reminderTime = DEFAULT_REMINDER_TIME) {
  const { hour, minute } = parseReminderTime(reminderTime);
  const nextTrigger = new Date();

  nextTrigger.setHours(hour, minute, 0, 0);

  if (nextTrigger.getTime() <= Date.now() + 5000) {
    nextTrigger.setDate(nextTrigger.getDate() + 1);
  }

  return nextTrigger;
}

function pickMotivationMessage() {
  const index = Math.floor(Math.random() * MOTIVATION_MESSAGES.length);
  return MOTIVATION_MESSAGES[index] || MOTIVATION_MESSAGES[0];
}

function buildReminderContent({ completedLoops, remainingLoops }) {
  const loopCopy =
    remainingLoops === 1
      ? "1 loop still needs you today"
      : `${remainingLoops} loops still need you today`;

  return {
    title: completedLoops === 0 ? "Start your loops today" : "Keep your loops moving",
    body: `${loopCopy}. ${pickMotivationMessage()}`,
    data: {
      kind: DAILY_LOOP_REMINDER_KIND,
      completedLoops,
      remainingLoops,
    },
  };
}

function configureNotificationHandler() {
  const Notifications = getNotificationsModule();

  if (!Notifications || hasConfiguredHandler) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  hasConfiguredHandler = true;
}

export function getLoopReminderStatus({ loops = [], todayCheckins = {} } = {}) {
  const totalLoops = Array.isArray(loops) ? loops.length : 0;
  const completedLoops = Array.isArray(loops)
    ? loops.filter((loop) => isLoopCompletedToday(loop, todayCheckins)).length
    : 0;
  const remainingLoops = Math.max(totalLoops - completedLoops, 0);

  return {
    totalLoops,
    completedLoops,
    remainingLoops,
    shouldNotify: totalLoops > 0 && remainingLoops > 0 && completedLoops <= 2,
  };
}

export function formatReminderTime(reminderTime = DEFAULT_REMINDER_TIME) {
  const { hour, minute } = parseReminderTime(reminderTime);
  const previewDate = new Date();

  previewDate.setHours(hour, minute, 0, 0);

  return previewDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function configureReminderNotificationsAsync() {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return false;
  }

  configureNotificationHandler();

  if (Platform.OS === "android" && !hasConfiguredChannel) {
    await Notifications.setNotificationChannelAsync(DAILY_LOOP_REMINDER_CHANNEL_ID, {
      name: "Daily loop reminders",
      description: "Motivational reminders for unfinished loops.",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4F8EF7",
      showBadge: false,
    });

    hasConfiguredChannel = true;
  }

  return true;
}

export async function cancelDailyLoopReminderAsync() {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminderNotifications = scheduled.filter(
    (request) =>
      request.identifier === DAILY_LOOP_REMINDER_ID ||
      request.content?.data?.kind === DAILY_LOOP_REMINDER_KIND
  );

  await Promise.allSettled(
    reminderNotifications.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier)
    )
  );
}

export async function requestReminderPermissionsAsync() {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return { granted: false, canAskAgain: false, status: "unavailable" };
  }

  await configureReminderNotificationsAsync();

  const currentPermissions = await Notifications.getPermissionsAsync();
  if (currentPermissions.granted) {
    return currentPermissions;
  }

  return Notifications.requestPermissionsAsync();
}

export async function syncDailyLoopReminderAsync({
  enabled,
  reminderTime = DEFAULT_REMINDER_TIME,
  loops = [],
  todayCheckins = {},
} = {}) {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return { scheduled: false, reason: "module-unavailable" };
  }

  await configureReminderNotificationsAsync();

  if (!enabled) {
    await cancelDailyLoopReminderAsync();
    return { scheduled: false, reason: "disabled" };
  }

  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    await cancelDailyLoopReminderAsync();
    return { scheduled: false, reason: "permission-denied" };
  }

  const reminderStatus = getLoopReminderStatus({ loops, todayCheckins });

  if (!reminderStatus.shouldNotify) {
    await cancelDailyLoopReminderAsync();
    return { scheduled: false, reason: "not-needed", status: reminderStatus };
  }

  const triggerDate = getNextTriggerDate(reminderTime);
  const content = buildReminderContent(reminderStatus);

  await cancelDailyLoopReminderAsync();

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: DAILY_LOOP_REMINDER_ID,
    content: {
      ...content,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: DAILY_LOOP_REMINDER_CHANNEL_ID,
    },
  });

  return {
    scheduled: true,
    identifier,
    triggerDate,
    status: reminderStatus,
  };
}

export async function enableDailyLoopReminderAsync({
  reminderTime = DEFAULT_REMINDER_TIME,
  loops = [],
  todayCheckins = {},
} = {}) {
  const permissions = await requestReminderPermissionsAsync();

  if (!permissions.granted) {
    await cancelDailyLoopReminderAsync();
    return {
      success: false,
      reason: permissions.status === "unavailable" ? "module-unavailable" : "permission-denied",
    };
  }

  const result = await syncDailyLoopReminderAsync({
    enabled: true,
    reminderTime,
    loops,
    todayCheckins,
  });

  return {
    success: true,
    ...result,
  };
}
