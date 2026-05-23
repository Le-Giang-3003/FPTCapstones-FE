const SLOT_ONE_START_MINUTES = 7 * 60;
const SLOT_DURATION_MINUTES = 135;
const SLOT_GAP_MINUTES = 15;
const LUNCH_BREAK_START_SLOT = 3;
const LUNCH_BREAK_OFFSET_MINUTES = 30;

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const getReviewSlotTimeRange = (slotIndex: number) => {
  const travelBufferMinutes = (slotIndex - 1) * SLOT_GAP_MINUTES;
  const lunchBreakOffset = slotIndex >= LUNCH_BREAK_START_SLOT ? LUNCH_BREAK_OFFSET_MINUTES : 0;
  const startMinutes = SLOT_ONE_START_MINUTES + (slotIndex - 1) * SLOT_DURATION_MINUTES + travelBufferMinutes + lunchBreakOffset;
  const endMinutes = startMinutes + SLOT_DURATION_MINUTES;
  return `${formatTime(startMinutes)} - ${formatTime(endMinutes)}`;
};