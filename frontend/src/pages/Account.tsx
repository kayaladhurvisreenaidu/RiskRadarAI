import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Download, Trash2, Save } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile, useDashboardData, useHistory, generateExportData } from '@/hooks/useLocalStorage';
import { toast } from '@/hooks/use-toast';

export default function Account() {
  const [profile, setProfile] = useProfile();
  const [dashboardData] = useDashboardData();
  const { history, clearHistory } = useHistory();

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age?.toString() || '');
  const [athleteType, setAthleteType] = useState(profile.athleteType);

  const handleSaveProfile = () => {
    setProfile({
      name,
      age: parseInt(age) || 0,
      athleteType,
    });
    toast({
      title: 'Profile Saved',
      description: 'Your profile has been updated successfully.',
    });
  };

  const handleExportJSON = () => {
    const exportData = generateExportData(dashboardData);

    // 1️⃣ Existing download functionality
    console.log('Exporting data:', JSON.stringify(exportData, null, 2));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riskradar_export_${exportData.system_date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Data Exported',
      description: 'Your data has been downloaded as JSON.',
    });

    // 2️⃣ New: send to backend API
    fetch("http://127.0.0.1:8000/predict-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData)
    })
    .then(res => res.json())
    .then(json => {
        console.log("Predicted risk:", json);
        toast({
            title: 'Predicted Risk',
            description: `Next 7 days risk: ${json.next_7_days_predicted_risk}, Confidence: ${json.confidence}`,
        });
    })
    .catch(err => {
        console.error("Error calling backend:", err);
        toast({
            title: 'Backend Error',
            description: 'Could not get predicted risk.',
            variant: 'destructive'
        });
    });
};


  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
      localStorage.removeItem('riskradar_dashboard');
      localStorage.removeItem('riskradar_profile');
      clearHistory();
      
      // Reset local state
      setName('');
      setAge('');
      setAthleteType('');

      toast({
        title: 'Data Cleared',
        description: 'All stored data has been removed.',
        variant: 'destructive',
      });

      // Reload to reset all state
      window.location.reload();
    }
  };

  // Get recent risk entries for history display
  const recentRiskEntries = history
    .filter(entry => entry.category === 'risk' || entry.metric === 'Overall Risk')
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-primary text-center mb-8"
        >
          Account
        </motion.h1>

        <div className="grid gap-6">
          {/* Profile Card */}
          <GlassCard premium>
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-primary text-lg">Profile</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="athleteType">Athlete Type</Label>
                <Select value={athleteType} onValueChange={setAthleteType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select athlete type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="runner">Runner</SelectItem>
                    <SelectItem value="cyclist">Cyclist</SelectItem>
                    <SelectItem value="swimmer">Swimmer</SelectItem>
                    <SelectItem value="triathlete">Triathlete</SelectItem>
                    <SelectItem value="team-sport">Team Sport Athlete</SelectItem>
                    <SelectItem value="strength">Strength Athlete</SelectItem>
                    <SelectItem value="crossfit">CrossFit Athlete</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveProfile} className="w-full mt-2">
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </div>
          </GlassCard>

          {/* Recent Risk History */}
          <GlassCard premium>
            <h3 className="font-semibold text-primary text-lg mb-4">Recent Risk Assessments</h3>
            
            {recentRiskEntries.length > 0 ? (
              <div className="space-y-2">
                {recentRiskEntries.map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.metric}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-primary">{entry.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No risk assessments recorded yet.</p>
            )}
          </GlassCard>

          {/* Data Management */}
          <GlassCard premium>
            <h3 className="font-semibold text-primary text-lg mb-4">Data Management</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={handleExportJSON} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>

              <Button onClick={handleClearData} variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </div>

            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Export Format:</strong> Downloads your data as a JSON file with athlete_id (701), 
                system_date, daily_load, resting_hr, hrv, sleep_quantity, past_injury, and days_since_injury.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  );
}
