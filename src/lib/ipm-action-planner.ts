import type { ScoutEntry, ScoutSeverity } from '@/lib/scouting-store';

export type IpmTargetType = 'insect' | 'disease' | 'weed';
export type IpmThresholdStatus = 'monitor' | 'prepare' | 'act';
export type IpmControlMethod = 'cultural' | 'mechanical' | 'biological' | 'chemical';

export interface IpmPlannerInput {
  fieldName: string;
  crop: string;
  targetName: string;
  targetType: IpmTargetType;
  observedCount: number;
  sampleCount: number;
  actionThreshold: number;
  unit: string;
  cropValuePerHa: number;
  controlCostPerHa: number;
  daysSinceScouting: number;
  recentSeverity: ScoutSeverity;
  previousModesOfAction: string[];
}

export interface IpmControlRecommendation {
  method: IpmControlMethod;
  recommended: boolean;
  rationale: string;
}

export interface IpmPlannerResult {
  averageDensity: number;
  thresholdRatio: number;
  thresholdStatus: IpmThresholdStatus;
  actionRecommended: boolean;
  economicExposurePerHa: number;
  scoutingDue: boolean;
  resistanceWarning: boolean;
  recentSameModeOfActionCount: number;
  priority: 'routine' | 'watch' | 'urgent';
  controls: IpmControlRecommendation[];
  nextActions: string[];
  warnings: string[];
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clampNonNegative(value: number): number {
  return Math.max(0, finiteOrZero(value));
}

function normalizedModes(modes: string[]): string[] {
  return modes.map(mode => mode.trim().toUpperCase()).filter(Boolean);
}

function countTrailingSameMode(modes: string[]): number {
  if (modes.length === 0) return 0;
  const last = modes[modes.length - 1];
  let count = 0;
  for (let index = modes.length - 1; index >= 0 && modes[index] === last; index -= 1) count += 1;
  return count;
}

function severityElevatesAction(severity: ScoutSeverity): boolean {
  return severity === 'critical';
}

export function summarizeScoutEvidence(entries: ScoutEntry[], fieldName: string, crop: string): {
  matchingEntries: ScoutEntry[];
  latestTimestamp: number | null;
  highestSeverity: ScoutSeverity | null;
  openCount: number;
} {
  const matchingEntries = entries
    .filter(entry => entry.fieldName.trim().toLowerCase() === fieldName.trim().toLowerCase())
    .filter(entry => !crop || entry.crop.trim().toLowerCase() === crop.trim().toLowerCase())
    .sort((a, b) => b.timestamp - a.timestamp);
  const severityRank: Record<ScoutSeverity, number> = { info: 1, warning: 2, critical: 3 };
  const highestSeverity = matchingEntries.reduce<ScoutSeverity | null>((highest, entry) => {
    if (!highest || severityRank[entry.severity] > severityRank[highest]) return entry.severity;
    return highest;
  }, null);
  const openCount = matchingEntries.filter(entry => (entry.status ?? (entry.severity === 'critical' ? 'open' : 'monitoring')) !== 'resolved').length;
  return {
    matchingEntries,
    latestTimestamp: matchingEntries[0]?.timestamp ?? null,
    highestSeverity,
    openCount,
  };
}

export function calculateIpmPlan(input: IpmPlannerInput): IpmPlannerResult {
  const observedCount = clampNonNegative(input.observedCount);
  const sampleCount = clampNonNegative(input.sampleCount);
  const threshold = clampNonNegative(input.actionThreshold);
  const averageDensity = sampleCount > 0 ? observedCount / sampleCount : 0;
  const thresholdRatio = threshold > 0 ? averageDensity / threshold : 0;
  const validObservation = sampleCount > 0 && threshold > 0;
  const thresholdStatus: IpmThresholdStatus = !validObservation || thresholdRatio < 0.75
    ? 'monitor'
    : thresholdRatio < 1
      ? 'prepare'
      : 'act';
  const actionRecommended = thresholdStatus === 'act' || severityElevatesAction(input.recentSeverity);
  const cropValuePerHa = clampNonNegative(input.cropValuePerHa);
  const controlCostPerHa = clampNonNegative(input.controlCostPerHa);
  const economicExposurePerHa = Math.max(0, averageDensity - threshold) * cropValuePerHa * 0.001;
  const daysSinceScouting = clampNonNegative(input.daysSinceScouting);
  const scoutingDue = daysSinceScouting >= 7 || actionRecommended;
  const modes = normalizedModes(input.previousModesOfAction);
  const recentSameModeOfActionCount = countTrailingSameMode(modes);
  const resistanceWarning = recentSameModeOfActionCount >= 2;
  const priority: IpmPlannerResult['priority'] = actionRecommended || input.recentSeverity === 'critical'
    ? 'urgent'
    : thresholdStatus === 'prepare' || input.recentSeverity === 'warning' || scoutingDue
      ? 'watch'
      : 'routine';

  const controls: IpmControlRecommendation[] = [
    {
      method: 'cultural',
      recommended: true,
      rationale: 'Use sanitation, rotation, resistant varieties, weed management, or habitat management to reduce pressure before treatment.',
    },
    {
      method: 'mechanical',
      recommended: actionRecommended || thresholdStatus === 'prepare',
      rationale: 'Use removal, trapping, exclusion, pruning, or targeted physical actions where practical.',
    },
    {
      method: 'biological',
      recommended: actionRecommended || input.recentSeverity === 'warning',
      rationale: 'Protect natural enemies and consider targeted biological or microbial controls appropriate to the identified target.',
    },
    {
      method: 'chemical',
      recommended: actionRecommended,
      rationale: actionRecommended
        ? 'Review the local label, crop stage, re-entry interval, pre-harvest interval, weather, and mode-of-action rotation before any application.'
        : 'Do not schedule a pesticide application until monitoring and the local action threshold justify it.',
    },
  ];

  const nextActions: string[] = [];
  if (!validObservation) nextActions.push('Enter a positive sample count and action threshold from a local crop-management guide.');
  if (scoutingDue) nextActions.push('Scout again soon using the same sampling method and record the target, stage, and damage level.');
  else nextActions.push('Continue routine scouting and record observations consistently for a field-specific threshold history.');
  if (thresholdStatus === 'prepare') nextActions.push('Prepare low-risk controls and verify identification before the threshold is exceeded.');
  if (actionRecommended) nextActions.push('Confirm the action threshold and use the least-risk effective control before considering a targeted pesticide.');
  if (resistanceWarning) nextActions.push('Rotate away from the latest mode of action; avoid a third consecutive application from the same group.');
  if (controlCostPerHa > 0 && economicExposurePerHa > 0 && economicExposurePerHa < controlCostPerHa) {
    nextActions.push('Recheck the economics: estimated exposure is currently below the entered control cost per hectare.');
  }

  const warnings: string[] = [];
  if (!input.fieldName.trim()) warnings.push('Add a field name so the action record can be assigned to the correct field.');
  if (!input.targetName.trim()) warnings.push('Identify the pest, disease, or weed before selecting a control.');
  if (sampleCount <= 0) warnings.push('Sample count must be greater than zero.');
  if (threshold <= 0) warnings.push('Use a positive action threshold supplied by local extension or crop guidance.');
  if (actionRecommended) warnings.push('A threshold signal is not a pesticide prescription: verify identification, label, weather, PPE, PHI, REI, and local requirements.');
  if (resistanceWarning) warnings.push('The same mode of action has been repeated at least twice consecutively; rotate to a different group when a treatment is justified.');

  return {
    averageDensity,
    thresholdRatio,
    thresholdStatus,
    actionRecommended,
    economicExposurePerHa,
    scoutingDue,
    resistanceWarning,
    recentSameModeOfActionCount,
    priority,
    controls,
    nextActions,
    warnings,
  };
}
