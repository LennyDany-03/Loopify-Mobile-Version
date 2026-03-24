const DEFAULT_WEEK_COUNT = 12;

export function formatNumericValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  if (Number.isInteger(numericValue)) {
    return String(numericValue);
  }

  return numericValue.toFixed(1).replace(/\.0$/, "");
}

function sentenceCase(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getLoopKey(loopOrId) {
  if (typeof loopOrId === "string") {
    return loopOrId;
  }

  return loopOrId?.id;
}

export function getTodayLoopEntry(loopOrId, todayCheckins = {}) {
  const key = getLoopKey(loopOrId);
  return key ? todayCheckins[key] || null : null;
}

export function isLoopCompletedToday(loopOrId, todayCheckins = {}) {
  return !!getTodayLoopEntry(loopOrId, todayCheckins)?.completed;
}

export function getLoopTargetValue(loop) {
  if (loop?.target_type === "boolean") {
    return 1;
  }

  const numericTarget = Number(loop?.target_value);
  return Number.isFinite(numericTarget) && numericTarget > 0 ? numericTarget : 0;
}

export function getTodayLoopProgress(loop, todayCheckins = {}) {
  if (!loop) {
    return {
      entry: null,
      value: 0,
      rawValue: 0,
      target: 0,
      percent: 0,
      completed: false,
      remaining: 0,
    };
  }

  const entry = getTodayLoopEntry(loop, todayCheckins);

  if (loop.target_type === "boolean") {
    const completed = !!entry?.completed;

    return {
      entry,
      value: completed ? 1 : 0,
      rawValue: completed ? 1 : 0,
      target: 1,
      percent: completed ? 100 : 0,
      completed,
      remaining: completed ? 0 : 1,
    };
  }

  const target = getLoopTargetValue(loop);
  const rawValue = Number(entry?.value ?? 0);
  const safeValue = Number.isFinite(rawValue) ? Math.max(rawValue, 0) : 0;
  const currentValue = target > 0 ? Math.min(safeValue, target) : safeValue;
  const completed = !!entry?.completed || (target > 0 && currentValue >= target);

  return {
    entry,
    value: currentValue,
    rawValue: safeValue,
    target,
    percent: target > 0 ? Math.min(Math.round((currentValue / target) * 100), 100) : 0,
    completed,
    remaining: target > 0 ? Math.max(target - currentValue, 0) : 0,
  };
}

export function getLoopDescription(loop, todayCheckins = {}) {
  if (!loop) {
    return "";
  }

  const progress = getTodayLoopProgress(loop, todayCheckins);

  if (progress.completed) {
    return "Completed today";
  }

  if (loop.target_type !== "boolean" && progress.value > 0 && progress.target > 0) {
    const current = formatNumericValue(progress.value);
    const target = formatNumericValue(progress.target);
    const unit = loop.target_unit ? ` ${loop.target_unit}` : "";
    return `${current} / ${target}${unit} today`;
  }

  const formattedValue = formatNumericValue(loop.target_value);
  if (formattedValue) {
    const unit = loop.target_unit ? ` ${loop.target_unit}` : "";
    return `${formattedValue}${unit} target`;
  }

  if (loop.frequency === "custom" && Array.isArray(loop.custom_days) && loop.custom_days.length) {
    return loop.custom_days.join(", ");
  }

  if (loop.frequency) {
    return `${sentenceCase(loop.frequency)} cadence`;
  }

  return loop.category || "General";
}

export function getLoopProgress(loop, todayCheckins = {}, maxTotalCheckins = 0) {
  if (!loop) {
    return 0;
  }

  const progress = getTodayLoopProgress(loop, todayCheckins);

  if (progress.completed) {
    return 100;
  }

  if (loop.target_type !== "boolean" && progress.percent > 0) {
    return progress.percent;
  }

  if (maxTotalCheckins > 0) {
    const percent = Math.round(((loop.total_checkins || 0) / maxTotalCheckins) * 100);
    return percent > 0 ? Math.max(percent, 10) : 0;
  }

  if (loop.best_streak > 0) {
    const percent = Math.round(((loop.current_streak || 0) / loop.best_streak) * 100);
    return percent > 0 ? Math.max(percent, 10) : 0;
  }

  return loop.total_checkins > 0 ? 25 : 0;
}

export function normalizeLoop(loop, options = {}) {
  const todayCheckins = options.todayCheckins || {};
  const maxTotalCheckins = options.maxTotalCheckins || 0;

  return {
    ...loop,
    title: loop?.name || loop?.title || "Untitled Loop",
    description: getLoopDescription(loop, todayCheckins),
    completion_rate: getLoopProgress(loop, todayCheckins, maxTotalCheckins),
  };
}

function padWeekNumber(weekNumber) {
  return String(weekNumber).padStart(2, "0");
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getWeekKey(value) {
  const date = startOfDay(value);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const yearStartWeekday = (yearStart.getDay() + 6) % 7;
  const diffInDays = Math.floor((date - yearStart) / 86400000);
  const weekNumber = Math.floor((diffInDays + yearStartWeekday) / 7);

  return `${date.getFullYear()}-W${padWeekNumber(weekNumber)}`;
}

export function getRecentWeekKeys(count = DEFAULT_WEEK_COUNT) {
  const seen = new Set();
  const keys = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - index * 7);
    const weekKey = getWeekKey(cursor);

    if (!seen.has(weekKey)) {
      seen.add(weekKey);
      keys.push(weekKey);
    }
  }

  return keys;
}

export function formatWeekLabel(weekKey) {
  const [, week = "00"] = weekKey.split("-W");
  return `WK ${week}`;
}

export function aggregateWeeklyCounts(loopWeeklyData = [], count = DEFAULT_WEEK_COUNT) {
  const weekKeys = getRecentWeekKeys(count);
  const countsByWeek = new Map(weekKeys.map((weekKey) => [weekKey, 0]));

  loopWeeklyData.forEach(({ weeks = [] }) => {
    weeks.forEach((entry) => {
      if (!countsByWeek.has(entry.week)) {
        countsByWeek.set(entry.week, 0);
      }

      countsByWeek.set(entry.week, countsByWeek.get(entry.week) + (entry.count || 0));
    });
  });

  const counts = weekKeys.map((weekKey) => countsByWeek.get(weekKey) || 0);
  const maxCount = Math.max(...counts, 0);

  return weekKeys.map((weekKey) => {
    const countForWeek = countsByWeek.get(weekKey) || 0;

    return {
      key: weekKey,
      label: formatWeekLabel(weekKey),
      count: countForWeek,
      value: maxCount > 0 ? countForWeek / maxCount : 0,
    };
  });
}

export function buildWeeklyBars(trendData = [], count = 7, targetValue = null) {
  const recentWeeks = trendData.slice(-count);
  const maxCount = targetValue !== null && targetValue > 0 
    ? Number(targetValue) 
    : Math.max(...recentWeeks.map((item) => item.count || 0), 0);

  return recentWeeks.map((item) => ({
    key: item.key,
    label: item.label,
    count: item.count || 0,
    active: (item.count || 0) > 0,
    height: maxCount > 0 ? Math.max(Math.min(Math.round(((item.count || 0) / maxCount) * 100), 100), 12) : 12,
  }));
}

function buildInsightGoal(loop) {
  const targetText = getLoopDescription(loop, {});
  return targetText.toUpperCase();
}

function buildDelta(currentCount, previousCount) {
  if (currentCount === 0 && previousCount === 0) {
    return 0;
  }

  if (previousCount === 0) {
    return currentCount > 0 ? 100 : 0;
  }

  return Math.round(((currentCount - previousCount) / previousCount) * 100);
}

export function buildRecentLoopInsights(loopWeeklyData = [], count = 3) {
  const weekKeys = getRecentWeekKeys(2);
  const previousWeekKey = weekKeys[0];
  const currentWeekKey = weekKeys[1];

  const insights = loopWeeklyData.map(({ loop, weeks = [] }) => {
    const weeklyCounts = new Map(weeks.map((entry) => [entry.week, entry.count || 0]));
    const currentCount = weeklyCounts.get(currentWeekKey) || 0;
    const previousCount = weeklyCounts.get(previousWeekKey) || 0;
    const delta = buildDelta(currentCount, previousCount);

    return {
      name: loop.name,
      goal: buildInsightGoal(loop),
      delta,
      positive: delta >= 0,
      icon: loop.icon || "repeat",
      currentCount,
      previousCount,
      total_checkins: loop.total_checkins || 0,
    };
  });

  const activeInsights = insights
    .filter((item) => item.currentCount > 0 || item.previousCount > 0)
    .sort((left, right) => {
      if (Math.abs(right.delta) !== Math.abs(left.delta)) {
        return Math.abs(right.delta) - Math.abs(left.delta);
      }

      return right.currentCount - left.currentCount;
    });

  const fallbackInsights = insights.sort(
    (left, right) => (right.total_checkins || 0) - (left.total_checkins || 0)
  );

  return (activeInsights.length ? activeInsights : fallbackInsights).slice(0, count);
}

export function buildCategoryPercents(categories = []) {
  const total = categories.reduce((sum, item) => sum + (item.total || 0), 0);

  if (!total) {
    return [];
  }

  return categories.map((item) => ({
    category: (item.category || "General").toUpperCase(),
    percent: Math.round(((item.total || 0) / total) * 100),
    total: item.total || 0,
  }));
}
