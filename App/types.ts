
export interface ScreeningSummary {
  skin_type: { label: string; confidence: number };
  possible_concerns: Array<{ label: string; confidence: number }>;
  limitations: string[];
}

export interface IngredientGuidance {
  beneficial: Array<{ ingredient: string; why: string }>;
  avoid_or_limit: Array<{ ingredient: string; reason: string }>;
  interaction_warnings: string[];
}

export interface Product {
  name: string;
  price: number;
  currency: string;
  key_ingredients: string[];
  link: string;
  why_this_pick: string;
}

export interface RoutineStep {
  step: string;
  usage: string;
  products: Product[];
  schedule?: string;
}

export interface WeeklyStep {
    step: string;
    frequency: string;
    guardrails: string;
    products: Product[];
}

export interface Routines {
  AM: RoutineStep[];
  PM: RoutineStep[];
  weekly: WeeklyStep[];
}

export interface PersonalizationFlags {
  budget_mode: boolean;
  fragrance_free_only: boolean;
  pregnant_or_breastfeeding: boolean;
  prescription_overlap_detected: boolean;
}

export interface FollowUp {
  patch_test_instructions: string;
  what_to_expect: string[];
  when_to_seek_dermatology: string[];
}

export interface AnalysisResponse {
  screening_summary: ScreeningSummary;
  ingredient_guidance: IngredientGuidance;
  routines: Routines;
  personalization_flags: PersonalizationFlags;
  follow_up: FollowUp;
  disclaimer: string;
}

export interface UserProfile {
    ageRange: string;
    sensitivities: string;
    isPregnantOrBreastfeeding: boolean;
    budget: string;
}

export enum AppState {
    Welcome,
    Capture,
    LiveCapture,
    Analyzing,
    Results,
    Error
}