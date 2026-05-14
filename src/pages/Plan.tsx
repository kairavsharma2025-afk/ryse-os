import { Schedule } from './Schedule'

/**
 * Plan tab — the consolidated home for Schedule + Reminders + Quick-add + Notes
 * + Time Blocking + Delegation Tracker per the redesign brief.
 *
 * Wave 2 ships the day-view (existing Schedule page) so the new IA works end
 * to end without a stub. Day/Week/Matrix segmented control, Inbox flow,
 * Delegation Tracker and Notes/Capture land in Wave 3.
 */
export function Plan() {
  return <Schedule />
}
