import { useEffect } from "react";
import useLoopStore from "../store/useLoopStore";

export function useLoops() {
  const {
    loops, isLoading, error,
    fetchLoops, createLoop, updateLoop, deleteLoop, clearError,
  } = useLoopStore();

  // Auto-fetch on mount if store is empty
  useEffect(() => {
    if (!loops.length) fetchLoops();
  }, [fetchLoops, loops.length]);

  return {
    loops,
    isLoading,
    error,
    clearError,
    refetch:    fetchLoops,
    createLoop,
    updateLoop,
    deleteLoop,
  };
}

// Single loop by ID from store
export function useLoop(id) {
  const { loops, isLoading, fetchLoops } = useLoopStore();

  useEffect(() => {
    if (!loops.length) fetchLoops();
  }, [fetchLoops, loops.length]);

  const loop = loops.find((l) => l.id === id) ?? null;
  return { loop, isLoading };
}
