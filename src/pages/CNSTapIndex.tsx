import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Timer, RotateCcw } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { calculateCNSScore } from '@/lib/validation';
import { useHistory } from '@/hooks/useLocalStorage';

type TestState = 'idle' | 'running' | 'complete';

export default function CNSTapIndex() {
  const [testState, setTestState] = useState<TestState>('idle');
  const [tapCount, setTapCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [result, setResult] = useState<ReturnType<typeof calculateCNSScore> | null>(null);
  const { addEntry } = useHistory();
  
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const startTest = useCallback(() => {
    setTestState('running');
    setTapCount(0);
    setTimeLeft(10);
    setResult(null);
    startTimeRef.current = performance.now();

    const updateTimer = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, 10 - elapsed);
      setTimeLeft(remaining);

      if (remaining > 0) {
        animationFrameRef.current = requestAnimationFrame(updateTimer);
      } else {
        setTestState('complete');
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, []);

  const handleTap = useCallback(() => {
    if (testState === 'running') {
      setTapCount(prev => prev + 1);
    }
  }, [testState]);

  const resetTest = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    setTestState('idle');
    setTapCount(0);
    setTimeLeft(10);
    setResult(null);
  }, []);

  // Calculate result when test completes
  useEffect(() => {
    if (testState === 'complete' && !result) {
      const cnsResult = calculateCNSScore(tapCount);
      setResult(cnsResult);
      addEntry({ metric: 'CNS Tap Score', value: cnsResult.score, category: 'performance' });
      addEntry({ metric: 'CNS Tap Count', value: tapCount, category: 'performance' });
    }
  }, [testState, tapCount, result, addEntry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const getFatigueColor = (level: 'high' | 'moderate' | 'low') => {
    switch (level) {
      case 'high': return 'text-destructive';
      case 'moderate': return 'text-warning';
      case 'low': return 'text-success';
    }
  };

  const getFatigueIcon = (level: 'high' | 'moderate' | 'low') => {
    switch (level) {
      case 'high': return '⚠️';
      case 'moderate': return '⚡';
      case 'low': return '✅';
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-primary text-center mb-8"
        >
          CNS TAP INDEX
        </motion.h1>

        {/* Main Card */}
        <GlassCard className="max-w-xl mx-auto" premium>
          <div className="text-center">
            {/* Timer Display */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Time Remaining</span>
              </div>
              <motion.p
                key={timeLeft}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-5xl font-bold text-primary tabular-nums"
              >
                {timeLeft.toFixed(1)}s
              </motion.p>
            </div>

            {/* Tap Zone */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <motion.span
                animate={{ x: testState === 'running' ? [0, 10, 0] : 0 }}
                transition={{ repeat: testState === 'running' ? Infinity : 0, duration: 0.5 }}
                className="text-xl font-bold text-primary"
              >
                TAP →
              </motion.span>

              <motion.button
                onClick={handleTap}
                disabled={testState !== 'running'}
                whileTap={testState === 'running' ? { scale: 0.95 } : undefined}
                animate={testState === 'running' ? {
                  boxShadow: [
                    '0 0 0 0 rgba(43, 18, 76, 0.4)',
                    '0 0 0 20px rgba(43, 18, 76, 0)',
                  ],
                } : undefined}
                transition={testState === 'running' ? {
                  repeat: Infinity,
                  duration: 1,
                } : undefined}
                className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center transition-all",
                  testState === 'running' 
                    ? "bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Target className="w-12 h-12" />
              </motion.button>
            </div>

            {/* Tap Count */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">Tap Count</p>
              <motion.p
                key={tapCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold text-primary"
              >
                {tapCount}
              </motion.p>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {testState === 'idle' && (
                <Button onClick={startTest} size="lg" className="px-8">
                  Start Test
                </Button>
              )}

              {testState === 'running' && (
                <Button onClick={resetTest} variant="outline" size="lg">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}

              {testState === 'complete' && (
                <Button onClick={resetTest} size="lg" className="px-8">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Results Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6"
            >
              <GlassCard className="max-w-xl mx-auto" premium>
                <h3 className="text-lg font-semibold text-primary text-center mb-4">
                  Test Results
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">CNS Score</p>
                    <p className="text-4xl font-bold text-primary">{result.score}/10</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Fatigue Level</p>
                    <p className={cn('text-2xl font-bold', getFatigueColor(result.fatigueLevel))}>
                      {getFatigueIcon(result.fatigueLevel)} {result.fatigueLevel.charAt(0).toUpperCase() + result.fatigueLevel.slice(1)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">
                    {result.interpretation}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
