export const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every other day",
  "Weekly",
  "As needed",
] as const;

export const DAY_FULL_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type Frequency = (typeof FREQUENCY_OPTIONS)[number];
export type DayName = (typeof DAY_FULL_NAMES)[number];
