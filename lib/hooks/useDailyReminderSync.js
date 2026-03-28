import { useEffect } from "react";
import { AppState } from "react-native";
import useAuthStore from "../store/useAuthStore";
import useLoopStore from "../store/useLoopStore";
import useReminderStore from "../store/useReminderStore";
import { syncDailyLoopReminderAsync } from "../notifications/dailyReminder";

export default function useDailyReminderSync({ enabled = true } = {}) {
  const user = useAuthStore((state) => state.user);
  const loops = useLoopStore((state) => state.loops);
  const todayCheckins = useLoopStore((state) => state.todayCheckins);
  const initializeReminder = useReminderStore((state) => state.initialize);
  const isReminderReady = useReminderStore((state) => state.isReady);
  const isReminderEnabled = useReminderStore((state) => state.enabled);
  const reminderTime = useReminderStore((state) => state.reminderTime);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void initializeReminder(user);
  }, [enabled, initializeReminder, user]);

  useEffect(() => {
    if (!enabled || !isReminderReady) {
      return;
    }

    void syncDailyLoopReminderAsync({
      enabled: isReminderEnabled,
      reminderTime,
      loops,
      todayCheckins,
    });
  }, [enabled, isReminderEnabled, isReminderReady, loops, reminderTime, todayCheckins]);

  useEffect(() => {
    if (!enabled || !isReminderReady) {
      return undefined;
    }

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState !== "active") {
        return;
      }

      void syncDailyLoopReminderAsync({
        enabled: useReminderStore.getState().enabled,
        reminderTime: useReminderStore.getState().reminderTime,
        loops: useLoopStore.getState().loops,
        todayCheckins: useLoopStore.getState().todayCheckins,
      });
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, isReminderReady]);
}
