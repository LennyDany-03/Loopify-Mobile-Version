import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import useLoopStore from "../store/useLoopStore";

export default function useLoopLiveSync({
  enabled = true,
  includeLoops = true,
  includeSummary = true,
  includeTodayCheckins = true,
  intervalMs = 60000,
} = {}) {
  const serverDate = useLoopStore((state) => state.serverDate);
  const fetchLoops = useLoopStore((state) => state.fetchLoops);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);
  const fetchTodayCheckins = useLoopStore((state) => state.fetchTodayCheckins);
  const isSyncingRef = useRef(false);
  const latestServerDateRef = useRef(serverDate);

  useEffect(() => {
    latestServerDateRef.current = serverDate;
  }, [serverDate]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let isMounted = true;

    async function syncLiveData(forceFullRefresh = false) {
      if (!isMounted || isSyncingRef.current) {
        return;
      }

      isSyncingRef.current = true;

      try {
        let nextServerDate = latestServerDateRef.current;

        if (includeTodayCheckins) {
          const todayData = await fetchTodayCheckins();
          nextServerDate = todayData?.server_date || todayData?.date || nextServerDate;
        }

        const shouldRefreshCollections =
          forceFullRefresh ||
          !includeTodayCheckins ||
          (!!nextServerDate && nextServerDate !== latestServerDateRef.current);

        if (nextServerDate) {
          latestServerDateRef.current = nextServerDate;
        }

        const requests = [];

        if (includeLoops && shouldRefreshCollections) {
          requests.push(fetchLoops());
        }

        if (includeSummary && shouldRefreshCollections) {
          requests.push(fetchSummary());
        }

        await Promise.allSettled(requests);
      } finally {
        isSyncingRef.current = false;
      }
    }

    syncLiveData(true);

    const intervalId = setInterval(syncLiveData, intervalMs);
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        syncLiveData(true);
      }
    });

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [
    fetchLoops,
    fetchSummary,
    fetchTodayCheckins,
    enabled,
    includeLoops,
    includeSummary,
    includeTodayCheckins,
    intervalMs,
  ]);
}
