import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, Activity, Heart, Brain, Moon, TrendingUp, AlertTriangle, Calendar, Target } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { validateField, calculateOverallRisk, getRiskInterpretation, calculateSleepScore, getRiskFactorAnalysis } from '@/lib/validation';
import { useDashboardData, useHistory, generateExportData, DashboardData } from '@/hooks/useLocalStorage';

interface CardState {
  isEditing: boolean;
  hasValue: boolean;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useDashboardData();
  const { addEntry } = useHistory();

  // Card states
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({
    dailyLoad: { isEditing: !dashboardData?.dailyLoad, hasValue: !!dashboardData?.dailyLoad },
    restingHr: { isEditing: !dashboardData?.restingHr, hasValue: !!dashboardData?.restingHr },
    hrv: { isEditing: !dashboardData?.hrv, hasValue: !!dashboardData?.hrv },
    sleep: { isEditing: !dashboardData?.sleepScore, hasValue: !!dashboardData?.sleepScore },
    acwr: { isEditing: !dashboardData?.acwr, hasValue: !!dashboardData?.acwr },
    pastInjury: { isEditing: dashboardData?.pastInjury === undefined, hasValue: dashboardData?.pastInjury !== undefined },
    daysSinceInjury: { isEditing: !dashboardData?.daysSinceInjury, hasValue: !!dashboardData?.daysSinceInjury },
    knownRisk: { isEditing: !dashboardData?.knownRiskFactor, hasValue: !!dashboardData?.knownRiskFactor },
  });

  // Form values
  const [duration, setDuration] = useState(dashboardData?.duration?.toString() || '');
  const [rpe, setRpe] = useState(dashboardData?.rpe?.toString() || '');
  const [restingHr, setRestingHr] = useState(dashboardData?.restingHr?.toString() || '');
  const [hrv, setHrv] = useState(dashboardData?.hrv?.toString() || '');
  const [sleepHours, setSleepHours] = useState(dashboardData?.sleepHours?.toString() || '');
  const [sleepQuality, setSleepQuality] = useState(dashboardData?.sleepQuality || 0.5);
  const [acwr, setAcwr] = useState(dashboardData?.acwr?.toString() || '');
  const [pastInjury, setPastInjury] = useState<string>(dashboardData?.pastInjury?.toString() || '');
  const [daysSinceInjury, setDaysSinceInjury] = useState(dashboardData?.daysSinceInjury?.toString() || '');
  const [knownRiskFactor, setKnownRiskFactor] = useState(dashboardData?.knownRiskFactor?.toString() || '');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndSetError = (field: string, value: string): boolean => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setErrors(prev => ({ ...prev, [field]: 'Please enter a valid number' }));
      return false;
    }
    const validation = validateField(field, numValue);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [field]: validation.message! }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    return true;
  };

  const handleDailyLoadSubmit = () => {
    const durationValid = validateAndSetError('duration', duration);
    const rpeValid = validateAndSetError('rpe', rpe);
    
    if (durationValid && rpeValid) {
      const durationNum = parseFloat(duration);
      const rpeNum = parseFloat(rpe);
      const dailyLoad = durationNum * rpeNum;
      
      updateDashboardData({ duration: durationNum, rpe: rpeNum, dailyLoad });
      addEntry({ metric: 'Daily Load', value: dailyLoad, category: 'training' });
      setCardStates(prev => ({ ...prev, dailyLoad: { isEditing: false, hasValue: true } }));
    }
  };

  const handleRestingHrSubmit = () => {
    if (validateAndSetError('restingHr', restingHr)) {
      const value = parseFloat(restingHr);
      updateDashboardData({ restingHr: value });
      addEntry({ metric: 'Resting HR', value, category: 'vitals' });
      setCardStates(prev => ({ ...prev, restingHr: { isEditing: false, hasValue: true } }));
    }
  };

  const handleHrvSubmit = () => {
    if (validateAndSetError('hrv', hrv)) {
      const value = parseFloat(hrv);
      updateDashboardData({ hrv: value });
      addEntry({ metric: 'HRV', value, category: 'vitals' });
      setCardStates(prev => ({ ...prev, hrv: { isEditing: false, hasValue: true } }));
    }
  };

  const handleSleepSubmit = () => {
    if (validateAndSetError('sleepHours', sleepHours)) {
      const hours = parseFloat(sleepHours);
      const score = calculateSleepScore(hours, sleepQuality);
      updateDashboardData({ sleepHours: hours, sleepQuality, sleepScore: score });
      addEntry({ metric: 'Sleep Score', value: score, category: 'recovery' });
      addEntry({ metric: 'Sleep Hours', value: hours, category: 'recovery' });
      setCardStates(prev => ({ ...prev, sleep: { isEditing: false, hasValue: true } }));
    }
  };

  const handleAcwrSubmit = () => {
    if (validateAndSetError('acwr', acwr)) {
      const value = parseFloat(acwr);
      updateDashboardData({ acwr: value });
      addEntry({ metric: 'ACWR', value, category: 'training' });
      setCardStates(prev => ({ ...prev, acwr: { isEditing: false, hasValue: true } }));
    }
  };

  const handlePastInjurySubmit = () => {
    const value = parseInt(pastInjury);
    updateDashboardData({ pastInjury: value });
    addEntry({ metric: 'Past Injury', value: value === 1 ? 'Yes' : 'No', category: 'health' });
    setCardStates(prev => ({ ...prev, pastInjury: { isEditing: false, hasValue: true } }));
  };

  const handleDaysSinceInjurySubmit = () => {
    if (validateAndSetError('daysSinceInjury', daysSinceInjury)) {
      const value = parseFloat(daysSinceInjury);
      updateDashboardData({ daysSinceInjury: value });
      addEntry({ metric: 'Days Since Injury', value, category: 'health' });
      setCardStates(prev => ({ ...prev, daysSinceInjury: { isEditing: false, hasValue: true } }));
    }
  };

  const handleKnownRiskSubmit = () => {
    if (validateAndSetError('riskFactor', knownRiskFactor)) {
      const value = parseFloat(knownRiskFactor);
      updateDashboardData({ knownRiskFactor: value });
      addEntry({ metric: 'Known Risk Factor', value, category: 'risk' });
      setCardStates(prev => ({ ...prev, knownRisk: { isEditing: false, hasValue: true } }));
    }
  };

  const updateDashboardData = (updates: Partial<DashboardData>) => {
    const newData = { ...(dashboardData || {} as DashboardData), ...updates };
    
    // Calculate overall risk if we have all required data
    if (
      newData.dailyLoad !== undefined &&
      newData.restingHr !== undefined &&
      newData.hrv !== undefined &&
      newData.sleepScore !== undefined &&
      newData.acwr !== undefined &&
      newData.pastInjury !== undefined &&
      newData.daysSinceInjury !== undefined
    ) {
      newData.overallRisk = calculateOverallRisk(newData);
    }
    
    setDashboardData(newData);
    
    // Log export data to console
    const exportData = generateExportData(newData);
    console.log('Dashboard Data Export:', JSON.stringify(exportData, null, 2));
  };

  const toggleEdit = (cardKey: string) => {
    setCardStates(prev => ({
      ...prev,
      [cardKey]: { ...prev[cardKey], isEditing: true }
    }));
  };

  const getRiskEmoji = (risk: number) => {
    if (risk < 35) return '🟢';
    if (risk < 70) return '🟡';
    return '🔴';
  };

  const overallRiskData = dashboardData?.overallRisk !== undefined 
    ? getRiskInterpretation(dashboardData.overallRisk)
    : null;

  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-primary text-center mb-8"
        >
          RiskRadar AI
        </motion.h1>

        {/* Grid Layout */}
        <div className="grid grid-cols-4 gap-4">
          {/* Daily Load - Wide Card (spans 2 columns) */}
          <GlassCard className="col-span-2 relative" premium>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-primary">Daily Load</h3>
              </div>
              {!cardStates.dailyLoad.isEditing && cardStates.dailyLoad.hasValue && (
                <button onClick={() => toggleEdit('dailyLoad')} className="p-1.5 hover:bg-muted rounded-full transition-colors">
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {cardStates.dailyLoad.isEditing ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Duration (mins)</Label>
                      <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="20-180"
                        className={cn(errors.duration && 'border-destructive shake')}
                      />
                      {errors.duration && (
                        <p className="text-xs text-destructive mt-1">{errors.duration}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">RPE (1-10)</Label>
                      <Input
                        type="number"
                        value={rpe}
                        onChange={(e) => setRpe(e.target.value)}
                        placeholder="1-10"
                        className={cn(errors.rpe && 'border-destructive shake')}
                      />
                      {errors.rpe && (
                        <p className="text-xs text-destructive mt-1">{errors.rpe}</p>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleDailyLoadSubmit} size="sm" className="w-full">
                    <Check className="w-4 h-4 mr-1" /> Calculate
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-4xl font-bold text-primary">{dashboardData?.dailyLoad}</p>
                  <p className="text-sm text-muted-foreground">Duration × RPE</p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Resting HR */}
          <GlassCard className="relative" premium>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary">Resting HR</h3>
              </div>
              {!cardStates.restingHr.isEditing && cardStates.restingHr.hasValue && (
                <button onClick={() => toggleEdit('restingHr')} className="p-1 hover:bg-muted rounded-full">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {cardStates.restingHr.isEditing ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <Input
                    type="number"
                    value={restingHr}
                    onChange={(e) => setRestingHr(e.target.value)}
                    placeholder="35-90 bpm"
                    className={cn('text-sm', errors.restingHr && 'border-destructive shake')}
                  />
                  {errors.restingHr && <p className="text-xs text-destructive">{errors.restingHr}</p>}
                  <Button onClick={handleRestingHrSubmit} size="sm" className="w-full text-xs">Save</Button>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <p className="text-3xl font-bold text-primary">{dashboardData?.restingHr}</p>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* HRV */}
          <GlassCard className="relative" premium>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary">HRV</h3>
              </div>
              {!cardStates.hrv.isEditing && cardStates.hrv.hasValue && (
                <button onClick={() => toggleEdit('hrv')} className="p-1 hover:bg-muted rounded-full">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {cardStates.hrv.isEditing ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <Input
                    type="number"
                    value={hrv}
                    onChange={(e) => setHrv(e.target.value)}
                    placeholder="20-130 ms"
                    className={cn('text-sm', errors.hrv && 'border-destructive shake')}
                  />
                  {errors.hrv && <p className="text-xs text-destructive">{errors.hrv}</p>}
                  <Button onClick={handleHrvSubmit} size="sm" className="w-full text-xs">Save</Button>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <p className="text-3xl font-bold text-primary">{dashboardData?.hrv}</p>
                  <p className="text-xs text-muted-foreground">ms</p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Sleep Quality */}
          <GlassCard className="relative" premium>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary">Sleep Quality</h3>
              </div>
              {!cardStates.sleep.isEditing && cardStates.sleep.hasValue && (
                <button onClick={() => toggleEdit('sleep')} className="p-1 hover:bg-muted rounded-full">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {cardStates.sleep.isEditing ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <Input
                    type="number"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="Hours (0-24)"
                    className={cn('text-sm', errors.sleepHours && 'border-destructive shake')}
                  />
                  {errors.sleepHours && <p className="text-xs text-destructive">{errors.sleepHours}</p>}
                  <div>
                    <Label className="text-xs text-muted-foreground">Quality: {sleepQuality.toFixed(1)}</Label>
                    <Slider
                      value={[sleepQuality]}
                      onValueChange={(v) => setSleepQuality(v[0])}
                      min={0}
                      max={1}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleSleepSubmit} size="sm" className="w-full text-xs">Save</Button>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <p className="text-3xl font-bold text-primary">{dashboardData?.sleepScore}</p>
                  <p className="text-xs text-muted-foreground">{dashboardData?.sleepHours}h sleep</p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* ACWR */}
          <GlassCard className="relative" premium>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary">ACWR</h3>
              </div>
              {!cardStates.acwr.isEditing && cardStates.acwr.hasValue && (
                <button onClick={() => toggleEdit('acwr')} className="p-1 hover:bg-muted rounded-full">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {cardStates.acwr.isEditing ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={acwr}
                    onChange={(e) => setAcwr(e.target.value)}
                    placeholder="0.3-3.0"
                    className={cn('text-sm', errors.acwr && 'border-destructive shake')}
                  />
                  {errors.acwr && <p className="text-xs text-destructive">{errors.acwr}</p>}
                  <Button onClick={handleAcwrSubmit} size="sm" className="w-full text-xs">Save</Button>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <p className="text-3xl font-bold text-primary">{dashboardData?.acwr}</p>
                  <p className="text-xs text-muted-foreground">Acute:Chronic</p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Past Injury */}
          <GlassCard className="relative" premium>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary">Past Injury</h3>
              </div>
              {!cardStates.pastInjury.isEditing && cardStates.pastInjury.hasValue && (
                <button onClick={() => toggleEdit('pastInjury')} className="p-1 hover:bg-muted rounded-full">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {cardStates.pastInjury.isEditing ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <Select value={pastInjury} onValueChange={setPastInjury}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handlePastInjurySubmit} size="sm" className="w-full text-xs" disabled={!pastInjury}>Save</Button>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <p className="text-3xl font-bold text-primary">{dashboardData?.pastInjury === 1 ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-muted-foreground">History</p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Days Since Injury */}
          <GlassCard className="relative" premium>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary">Days Since Injury</h3>
              </div>
              {!cardStates.daysSinceInjury.isEditing && cardStates.daysSinceInjury.hasValue && (
                <button onClick={() => toggleEdit('daysSinceInjury')} className="p-1 hover:bg-muted rounded-full">
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {cardStates.daysSinceInjury.isEditing ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <Input
                    type="number"
                    value={daysSinceInjury}
                    onChange={(e) => setDaysSinceInjury(e.target.value)}
                    placeholder="0-365"
                    className={cn('text-sm', errors.daysSinceInjury && 'border-destructive shake')}
                  />
                  {errors.daysSinceInjury && <p className="text-xs text-destructive">{errors.daysSinceInjury}</p>}
                  <Button onClick={handleDaysSinceInjurySubmit} size="sm" className="w-full text-xs">Save</Button>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <p className="text-3xl font-bold text-primary">{dashboardData?.daysSinceInjury}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Overall Risk Factor - Spans 2 columns */}
          <GlassCard className="col-span-2" premium>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-primary">Overall Risk Factor</h3>
            </div>

            <div className="text-center">
              {dashboardData?.overallRisk !== undefined ? (
                <>
                  <p className={cn('text-5xl font-bold mb-2', overallRiskData?.color)}>
                    {dashboardData.overallRisk}
                  </p>
                  <p className={cn('text-lg font-medium', overallRiskData?.color)}>
                    {overallRiskData?.label}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Complete all metrics to calculate overall risk
                </p>
              )}
            </div>
          </GlassCard>

          {/* Know Your Risk Factor - Small Card (spans 2 columns) */}
          <GlassCard className="col-span-2 relative" premium>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary">Know Your Risk Factor</h3>
              <div className="flex items-center gap-2">
                {dashboardData?.knownRiskFactor !== undefined && (
                  <span className="text-xl">{getRiskEmoji(dashboardData.knownRiskFactor)}</span>
                )}
                {!cardStates.knownRisk.isEditing && cardStates.knownRisk.hasValue && (
                  <button onClick={() => toggleEdit('knownRisk')} className="p-1 hover:bg-muted rounded-full">
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {cardStates.knownRisk.isEditing ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <Input
                    type="number"
                    value={knownRiskFactor}
                    onChange={(e) => setKnownRiskFactor(e.target.value)}
                    placeholder="0-100"
                    className={cn('text-sm', errors.riskFactor && 'border-destructive shake')}
                  />
                  {errors.riskFactor && <p className="text-xs text-destructive">{errors.riskFactor}</p>}
                  <Button onClick={handleKnownRiskSubmit} size="sm" className="w-full text-xs">Analyze</Button>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-2xl font-bold text-primary mb-1">{dashboardData?.knownRiskFactor}%</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dashboardData?.knownRiskFactor !== undefined && getRiskFactorAnalysis(dashboardData.knownRiskFactor)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  );
}
