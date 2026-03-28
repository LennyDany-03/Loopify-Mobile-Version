import { create } from "zustand";
import { analyticsAPI, checkinsAPI, loopsAPI } from "../api";

const useLoopStore = create((set, get) => ({
  loops: [],
  summary: null,
  todayCheckins: {},
  serverDate: null,
  isLoading: false,
  error: null,

  fetchLoops: async () => {
    set({ isLoading: true, error: null });

    try {
      const res = await loopsAPI.getAll();
      set({ loops: res.data.loops || [], isLoading: false });
      return res.data.loops || [];
    } catch (err) {
      set({
        error: err.response?.data?.detail || "Failed to load loops.",
        isLoading: false,
      });
      return [];
    }
  },

  createLoop: async (data) => {
    try {
      const res = await loopsAPI.create(data);
      const newLoop = res.data.loop;
      set((state) => ({ loops: [...state.loops, newLoop] }));
      return { success: true, loop: newLoop };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || "Failed to create loop.",
      };
    }
  },

  updateLoop: async (id, data) => {
    try {
      const res = await loopsAPI.update(id, data);
      const updated = res.data.loop;
      set((state) => ({
        loops: state.loops.map((loop) => (loop.id === id ? updated : loop)),
      }));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || "Failed to update loop.",
      };
    }
  },

  deleteLoop: async (id) => {
    try {
      await loopsAPI.delete(id);
      set((state) => {
        const nextTodayCheckins = { ...state.todayCheckins };
        delete nextTodayCheckins[id];

        return {
          loops: state.loops.filter((loop) => loop.id !== id),
          todayCheckins: nextTodayCheckins,
        };
      });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || "Failed to delete loop.",
      };
    }
  },

  checkinLoop: async (loopId, value = null, note = null) => {
    try {
      const payload = { loop_id: loopId };
      if (value !== null) payload.value = value;
      if (note !== null) payload.note = note;

      const res = await checkinsAPI.create(payload);
      const { streak, checkin, server_date: serverDate } = res.data;

      set((state) => ({
        loops: state.loops.map((loop) =>
          loop.id === loopId
            ? {
                ...loop,
                current_streak: streak.current_streak,
                best_streak: streak.best_streak,
                total_checkins: streak.total_checkins,
                last_checkin_date: streak.last_checkin_date,
              }
            : loop
        ),
        todayCheckins: { ...state.todayCheckins, [loopId]: checkin },
        serverDate: serverDate || checkin?.date || state.serverDate,
      }));

      return { success: true, streak, checkin };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || "Failed to log checkin.",
      };
    }
  },

  undoTodayCheckin: async (loopId) => {
    try {
      const todayEntry = get().todayCheckins?.[loopId];

      if (!todayEntry?.id) {
        return {
          success: false,
          error: "No check-in found for today.",
        };
      }

      const res = await checkinsAPI.delete(todayEntry.id);
      const { streak, server_date: serverDate } = res.data;

      set((state) => {
        const nextTodayCheckins = { ...state.todayCheckins };
        delete nextTodayCheckins[loopId];

        return {
          loops: state.loops.map((loop) =>
            loop.id === loopId
              ? {
                  ...loop,
                  current_streak: streak.current_streak,
                  best_streak: streak.best_streak,
                  total_checkins: streak.total_checkins,
                  last_checkin_date: streak.last_checkin_date,
                }
              : loop
          ),
          todayCheckins: nextTodayCheckins,
          serverDate: serverDate || state.serverDate,
        };
      });

      return { success: true, streak };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || "Failed to undo today's progress.",
      };
    }
  },

  fetchTodayCheckins: async () => {
    try {
      const res = await checkinsAPI.getToday();
      set({
        todayCheckins: res.data.completed || {},
        serverDate: res.data.server_date || res.data.date || null,
      });
      return res.data;
    } catch {
      return null;
    }
  },

  fetchSummary: async () => {
    try {
      const res = await analyticsAPI.summary();
      set((state) => ({
        summary: res.data,
        serverDate: res.data?.server_date || state.serverDate,
      }));
      return res.data;
    } catch {
      return null;
    }
  },

  reset: () =>
    set({
      loops: [],
      summary: null,
      todayCheckins: {},
      serverDate: null,
      error: null,
    }),

  clearError: () => set({ error: null }),
}));

export default useLoopStore;
