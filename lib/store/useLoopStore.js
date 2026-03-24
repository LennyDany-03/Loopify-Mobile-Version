import { create } from "zustand";
import { loopsAPI, checkinsAPI, analyticsAPI } from "../api";

const useLoopStore = create((set, get) => ({
  loops:         [],
  summary:       null,
  todayCheckins: {},
  isLoading:     false,
  error:         null,

  // ── Fetch all loops ─────────────────────────────────────────────────────────
  fetchLoops: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await loopsAPI.getAll();
      set({ loops: res.data.loops, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.detail || "Failed to load loops.",
        isLoading: false,
      });
    }
  },

  // ── Create loop ─────────────────────────────────────────────────────────────
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

  // ── Update loop ─────────────────────────────────────────────────────────────
  updateLoop: async (id, data) => {
    try {
      const res = await loopsAPI.update(id, data);
      const updated = res.data.loop;
      set((state) => ({
        loops: state.loops.map((l) => (l.id === id ? updated : l)),
      }));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || "Failed to update loop.",
      };
    }
  },

  // ── Delete loop ─────────────────────────────────────────────────────────────
  deleteLoop: async (id) => {
    try {
      await loopsAPI.delete(id);
      set((state) => {
        const nextTodayCheckins = { ...state.todayCheckins };
        delete nextTodayCheckins[id];

        return {
          loops: state.loops.filter((l) => l.id !== id),
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

  // ── Log a checkin ───────────────────────────────────────────────────────────
  checkinLoop: async (loopId, value = null, note = null) => {
    try {
      const payload = { loop_id: loopId };
      if (value !== null) payload.value = value;
      if (note  !== null) payload.note  = note;

      const res = await checkinsAPI.create(payload);
      const { streak, checkin } = res.data;

      // Update loop stats in store instantly — no refetch needed
      set((state) => ({
        loops: state.loops.map((l) =>
          l.id === loopId
            ? {
                ...l,
                current_streak: streak.current_streak,
                best_streak:    streak.best_streak,
                total_checkins: streak.total_checkins,
              }
            : l
        ),
        todayCheckins: { ...state.todayCheckins, [loopId]: checkin },
      }));

      return { success: true, streak, checkin };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || "Failed to log checkin.",
      };
    }
  },

  // ── Fetch today's completed loops ───────────────────────────────────────────
  fetchTodayCheckins: async () => {
    try {
      const res = await checkinsAPI.getToday();
      set({ todayCheckins: res.data.completed });
    } catch {}
  },

  // ── Fetch dashboard summary ─────────────────────────────────────────────────
  fetchSummary: async () => {
    try {
      const res = await analyticsAPI.summary();
      set({ summary: res.data });
    } catch {}
  },

  // ── Reset store on logout ───────────────────────────────────────────────────
  reset: () => set({
    loops: [], summary: null, todayCheckins: {}, error: null,
  }),

  clearError: () => set({ error: null }),
}));

export default useLoopStore;
