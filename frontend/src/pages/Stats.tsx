import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Moon, Clock, Database } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { GlassCard } from '@/components/GlassCard';
import { useHistory, useDashboardData } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

export default function Stats() {
  const { history } = useHistory();
  const [dashboardData] = useDashboardData();

  // Get sleep-related history for the graph
  const sleepData = history
    .filter(entry => entry.metric === 'Sleep Hours')
    .slice(0, 14)
    .reverse()
    .map((entry, index) => ({
      day: `Day ${index + 1}`,
      hours: typeof entry.value === 'number' ? entry.value : parseFloat(entry.value as string),
      timestamp: new Date(entry.timestamp).toLocaleDateString(),
    }));

  // Calculate sleep quality gauge value
  const sleepQuality = dashboardData?.sleepQuality || 0.5;
  const sleepQualityPercent = Math.round(sleepQuality * 100);

  // Gauge data
  const gaugeData = [
    { name: 'Quality', value: sleepQualityPercent },
    { name: 'Remaining', value: 100 - sleepQualityPercent },
  ];

  const GAUGE_COLORS = ['hsl(280, 58%, 23%)', 'hsl(270, 20%, 88%)'];

  // Format history for table
  const tableData = history.slice(0, 20);

  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-primary text-center mb-8"
        >
          Statistics
        </motion.h1>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Sleep Quality Gauge + Past Data Table */}
          <div className="space-y-6">
            {/* Sleep Quality Gauge */}
            <GlassCard premium>
              <div className="flex items-center gap-2 mb-4">
                <Moon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-primary">Sleep Quality</h3>
              </div>

              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {gaugeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={GAUGE_COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center -mt-16">
                <p className="text-4xl font-bold text-primary">{sleepQualityPercent}%</p>
                <p className="text-sm text-muted-foreground">Quality Score</p>
              </div>
            </GlassCard>

            {/* Past Data Table */}
            <GlassCard className="max-h-80" premium>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-primary">Past Data</h3>
              </div>

              <div className="overflow-auto max-h-52">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Time</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Metric</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length > 0 ? (
                      tableData.map((entry) => (
                        <tr key={entry.id} className="border-b border-border/50">
                          <td className="py-2 text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 text-foreground">{entry.metric}</td>
                          <td className="py-2 text-right font-medium text-primary">{entry.value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-muted-foreground">
                          No data recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Sleep Hours Graph (spans 2 columns) */}
          <GlassCard className="col-span-2" premium>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-primary">Sleep Hours Trend</h3>
            </div>

            <div className="h-80">
              {sleepData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sleepData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(270, 20%, 88%)" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: 'hsl(270, 20%, 45%)', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(270, 20%, 88%)' }}
                    />
                    <YAxis 
                      domain={[0, 12]}
                      tick={{ fill: 'hsl(270, 20%, 45%)', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(270, 20%, 88%)' }}
                      label={{ 
                        value: 'Hours', 
                        angle: -90, 
                        position: 'insideLeft',
                        fill: 'hsl(270, 20%, 45%)'
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 24px rgba(43, 18, 76, 0.1)',
                      }}
                      labelStyle={{ color: 'hsl(280, 58%, 23%)', fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="hsl(280, 58%, 23%)"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(280, 58%, 23%)', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: 'hsl(280, 58%, 23%)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Record sleep data on the Dashboard to see trends</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  );
}
