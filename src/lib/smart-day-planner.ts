// Smart Day Planner types and client helper
export type SmartPlannerItemType = 'irrigation' | 'fertilization' | 'task' | 'cropProtection' | 'scouting' | 'harvest';
export type SmartPlannerPriority = 'high' | 'medium' | 'low';

export interface SmartPlannerItem {
  id: string;
  date: string; // YYYY-MM-DD
  timeWindow: string; // e.g. "06:30 - 08:30"
  type: SmartPlannerItemType;
  priority: SmartPlannerPriority;
  fieldId: string;
  fieldName: string;
  crop: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'dismissed';
  reasoning: string;
  stage?: string;
  metrics?: {
    waterM3?: number;
    fertilizerKg?: number;
    durationMin?: number;
    dosage?: string;
    targetNutrient?: string;
  };
}

export interface SmartDayPlanSummary {
  generatedAt: string;
  planSummary: string;
  dailyFocus: string;
  weatherCaution: string;
  totalWaterM3: number;
  totalFertilizerKg: number;
  criticalTasksCount: number;
  items: SmartPlannerItem[];
  weeklyMatrix?: Array<{
    date: string;
    dayName: string;
    irrigationRuns: number;
    nutrientApplications: number;
    tasksCount: number;
  }>;
}

export interface ActiveFieldInput {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
  plantingDate?: string;
  currentStage?: string;
  soilType?: string;
  irrigationType?: string;
  openScoutCount?: number;
  recentScoutIssues?: string[];
  soilConstraints?: string[];
  zone?: 'coastal' | 'highPlateaus' | 'sahara';
}

export interface SmartPlannerRequest {
  selectedDate?: string;
  zone?: 'coastal' | 'highPlateaus' | 'sahara';
  language?: 'en' | 'fr' | 'ar';
  fields: ActiveFieldInput[];
}

export const SMART_PLANNER_STORAGE_KEY = 'formula_atlas_smart_day_plan_v1';
