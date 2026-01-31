// Validation rules for RiskRadar AI inputs

export interface ValidationRule {
  min: number;
  max: number;
  message: string;
}

export const validationRules: Record<string, ValidationRule> = {
  duration: {
    min: 20,
    max: 180,
    message: "Training duration should be between 20-180 minutes for accurate load calculation",
  },
  rpe: {
    min: 1,
    max: 10,
    message: "Rate of Perceived Exertion must be on a 1-10 scale",
  },
  restingHr: {
    min: 35,
    max: 90,
    message: "Resting heart rate outside normal athletic range (35-90 bpm)",
  },
  hrv: {
    min: 20,
    max: 130,
    message: "HRV reading appears abnormal. Typical range: 20-130 ms",
  },
  sleepHours: {
    min: 0,
    max: 24,
    message: "Please enter valid sleep hours (0-24)",
  },
  sleepQuality: {
    min: 0,
    max: 1,
    message: "Quality score must be between 0 (poor) and 1 (excellent)",
  },
  acwr: {
    min: 0.3,
    max: 3.0,
    message: "ACWR outside safe training zone. Optimal: 0.8-1.3",
  },
  daysSinceInjury: {
    min: 0,
    max: 365,
    message: "Please enter days since last injury (0-365)",
  },
  riskFactor: {
    min: 0,
    max: 100,
    message: "Risk factor must be a percentage (0-100)",
  },
};

export function validateField(field: string, value: number): { isValid: boolean; message?: string } {
  const rule = validationRules[field];
  if (!rule) return { isValid: true };

  const isValid = value >= rule.min && value <= rule.max;
  return {
    isValid,
    message: isValid ? undefined : rule.message,
  };
}

// Calculate overall risk score (0-100)
export function calculateOverallRisk(data: {
  dailyLoad: number;
  restingHr: number;
  hrv: number;
  sleepScore: number;
  acwr: number;
  pastInjury: number;
  daysSinceInjury: number;
}): number {
  // Normalize each factor to 0-100 scale where higher = more risk
  
  // Daily Load: Higher load = higher risk (assume max load is 180*10=1800)
  const loadRisk = Math.min((data.dailyLoad / 1800) * 100, 100);
  
  // Resting HR: Higher HR = higher risk (normalize 35-90 range)
  const hrRisk = ((data.restingHr - 35) / 55) * 100;
  
  // HRV: Lower HRV = higher risk (normalize 20-130 range, invert)
  const hrvRisk = 100 - ((data.hrv - 20) / 110) * 100;
  
  // Sleep: Lower score = higher risk (invert)
  const sleepRisk = 100 - data.sleepScore;
  
  // ACWR: Deviation from 1.0 = higher risk
  const acwrDeviation = Math.abs(data.acwr - 1.0);
  const acwrRisk = Math.min(acwrDeviation * 50, 100);
  
  // Past Injury: 1 = higher base risk
  const injuryRisk = data.pastInjury === 1 ? 30 : 0;
  
  // Days Since Injury: Fewer days = higher risk (only if injured)
  const recencyRisk = data.pastInjury === 1 
    ? Math.max(0, 30 - (data.daysSinceInjury / 12)) // Decays over ~1 year
    : 0;

  // Weighted average
  const weightedRisk = (
    loadRisk * 0.2 +
    hrRisk * 0.1 +
    hrvRisk * 0.15 +
    sleepRisk * 0.2 +
    acwrRisk * 0.15 +
    injuryRisk * 0.1 +
    recencyRisk * 0.1
  );

  return Math.round(Math.min(Math.max(weightedRisk, 0), 100));
}

// Get risk interpretation
export function getRiskInterpretation(risk: number): {
  level: 'low' | 'moderate' | 'high';
  label: string;
  color: string;
} {
  if (risk < 35) {
    return { level: 'low', label: 'Low Risk', color: 'text-success' };
  } else if (risk < 70) {
    return { level: 'moderate', label: 'Moderate Risk', color: 'text-warning' };
  } else {
    return { level: 'high', label: 'High Risk', color: 'text-destructive' };
  }
}

// Calculate sleep score
export function calculateSleepScore(hours: number, quality: number): number {
  // Optimal sleep is 7-9 hours
  let hoursScore: number;
  if (hours >= 7 && hours <= 9) {
    hoursScore = 100;
  } else if (hours >= 6 && hours < 7) {
    hoursScore = 80;
  } else if (hours > 9 && hours <= 10) {
    hoursScore = 90;
  } else if (hours >= 5 && hours < 6) {
    hoursScore = 60;
  } else if (hours > 10) {
    hoursScore = 70;
  } else {
    hoursScore = Math.max(0, hours * 10);
  }

  // Combine hours and quality (weighted 60/40)
  const qualityScore = quality * 100;
  return Math.round(hoursScore * 0.6 + qualityScore * 0.4);
}

// CNS Tap scoring
export function calculateCNSScore(taps: number): {
  score: number;
  interpretation: string;
  fatigueLevel: 'high' | 'moderate' | 'low';
} {
  // Baseline: 40-60 taps in 10 seconds for athletes
  // Normalize to 1-10 scale
  const normalizedScore = Math.round(((taps - 20) / 60) * 10);
  const score = Math.min(Math.max(normalizedScore, 1), 10);

  if (score <= 3) {
    return { score, interpretation: 'High Fatigue - Consider rest day', fatigueLevel: 'high' };
  } else if (score <= 6) {
    return { score, interpretation: 'Moderate Fatigue - Light training recommended', fatigueLevel: 'moderate' };
  } else {
    return { score, interpretation: 'Low Fatigue - Good to train', fatigueLevel: 'low' };
  }
}

// Risk factor analysis text
export function getRiskFactorAnalysis(riskFactor: number): string {
  if (riskFactor < 35) {
    return "Excellent condition! Your metrics indicate low injury risk. Maintain current training load.";
  } else if (riskFactor < 70) {
    return "Moderate risk detected. Monitor fatigue levels and consider adjusting training intensity.";
  } else {
    return "High risk alert! Recommend reducing load, improving recovery, and consulting with staff.";
  }
}
