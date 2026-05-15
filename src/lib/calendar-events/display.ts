export type CalendarRecurrenceDisplayEvent = {
  recurrence_series_id?: string | null;
  recurrence_parent_id?: string | null;
  recurrence_position?: number | null;
  recurrence_generated_at?: string | null;
  recurrence_rule?: {
    cron_enabled?: boolean;
    automation?: string;
    timezone?: string;
    range_end?: string;
    days?: string[];
  } | null;
};

export function getRecurrenceDisplay(event: CalendarRecurrenceDisplayEvent) {
  const isRecurring = Boolean(event.recurrence_series_id);
  const isGeneratedOccurrence = Boolean(event.recurrence_parent_id);
  const isSeriesStart = isRecurring && !isGeneratedOccurrence;
  const occurrenceNumber = isRecurring ? event.recurrence_position ?? 1 : null;
  const cronEnabled = Boolean(event.recurrence_rule?.cron_enabled);
  const automationPending = isRecurring && !cronEnabled;

  return {
    isRecurring,
    isGeneratedOccurrence,
    isSeriesStart,
    occurrenceNumber,
    occurrenceLabel: occurrenceNumber ? `Occurrence #${occurrenceNumber}` : null,
    typeLabel: isGeneratedOccurrence ? "Generated Occurrence" : isSeriesStart ? "Series Start" : "One-Time",
    automationLabel: automationPending ? "Automation Pending" : cronEnabled ? "Automation Enabled" : null,
    automationPending,
    editNotice: isRecurring
      ? "This edits only this occurrence. Series-wide editing is not enabled in this phase."
      : null,
  };
}
