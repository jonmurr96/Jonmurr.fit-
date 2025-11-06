import React, { useMemo } from 'react';
import { WorkoutHistory, WeightLog, DailyLog, MacroDayTarget } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrophyIcon, FireIcon, ChartLineIcon } from '../components/Icons';

interface AnalyticsScreenProps {
  workoutHistory: WorkoutHistory;
  weightLogs: WeightLog[];
  dailyLogs: DailyLog[];
  macroTargets: MacroDayTarget;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  workoutHistory,
  weightLogs,
  dailyLogs,
  macroTargets
}) => {
  // Calculate total volume (weight × reps) per week
  const volumeByWeek = useMemo(() => {
    const weekMap = new Map<string, number>();

    workoutHistory.forEach(workout => {
      const date = new Date(workout.dateCompleted);
      // Get week number (simple: group by week start)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      let weekVolume = weekMap.get(weekKey) || 0;

      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.actualWeight && set.actualReps) {
            weekVolume += set.actualWeight * set.actualReps;
          }
        });
      });

      weekMap.set(weekKey, weekVolume);
    });

    return Array.from(weekMap.entries())
      .map(([week, volume]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: Math.round(volume)
      }))
      .slice(-8); // Last 8 weeks
  }, [workoutHistory]);

  // Detect Personal Records (PRs)
  const personalRecords = useMemo(() => {
    const exercisePRs = new Map<string, { weight: number, reps: number, date: string }>();

    workoutHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const currentPR = exercisePRs.get(exercise.name);

        exercise.sets.forEach(set => {
          if (set.actualWeight && set.actualReps) {
            const volume = set.actualWeight * set.actualReps;
            const currentVolume = currentPR ? currentPR.weight * currentPR.reps : 0;

            if (!currentPR || volume > currentVolume) {
              exercisePRs.set(exercise.name, {
                weight: set.actualWeight,
                reps: set.actualReps,
                date: workout.dateCompleted
              });
            }
          }
        });
      });
    });

    return Array.from(exercisePRs.entries())
      .map(([name, pr]) => ({ name, ...pr }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Top 5 recent PRs
  }, [workoutHistory]);

  // Workout consistency (days per week)
  const consistencyData = useMemo(() => {
    const last12Weeks = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay()) - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const workoutsThisWeek = workoutHistory.filter(w => {
        const wDate = new Date(w.dateCompleted);
        return wDate >= weekStart && wDate <= weekEnd;
      }).length;

      last12Weeks.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workouts: workoutsThisWeek
      });
    }

    return last12Weeks;
  }, [workoutHistory]);

  // Most improved exercise (% increase over last 4 weeks)
  const mostImproved = useMemo(() => {
    const exerciseProgress = new Map<string, { first: number, last: number }>();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentWorkouts = workoutHistory.filter(w =>
      new Date(w.dateCompleted) >= fourWeeksAgo
    );

    recentWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const bestSet = exercise.sets
          .filter(s => s.actualWeight && s.actualReps)
          .reduce((best, set) => {
            const volume = (set.actualWeight || 0) * (set.actualReps || 0);
            return volume > best ? volume : best;
          }, 0);

        if (bestSet > 0) {
          const current = exerciseProgress.get(exercise.name);
          if (!current) {
            exerciseProgress.set(exercise.name, { first: bestSet, last: bestSet });
          } else {
            current.last = bestSet;
          }
        }
      });
    });

    const improvements = Array.from(exerciseProgress.entries())
      .map(([name, { first, last }]) => ({
        name,
        improvement: ((last - first) / first) * 100
      }))
      .filter(e => e.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement);

    return improvements[0] || null;
  }, [workoutHistory]);

  // Nutrition consistency
  const nutritionConsistency = useMemo(() => {
    const last7Days = dailyLogs.slice(-7);
    const targetsMet = last7Days.filter(log => {
      return log.macros.protein >= macroTargets.protein &&
             log.macros.carbs >= macroTargets.carbs &&
             log.macros.fat >= macroTargets.fat;
    }).length;

    return Math.round((targetsMet / 7) * 100);
  }, [dailyLogs, macroTargets]);

  const totalWorkouts = workoutHistory.length;
  const avgWorkoutsPerWeek = consistencyData.length > 0
    ? (consistencyData.reduce((sum, w) => sum + w.workouts, 0) / consistencyData.length).toFixed(1)
    : '0';

  return (
    <div className="p-4 space-y-6 text-white pb-24">
      <h1 className="text-3xl font-bold">Analytics</h1>

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-2xl p-4">
          <TrophyIcon className="w-8 h-8 text-amber-400 mb-2" />
          <p className="text-3xl font-bold">{totalWorkouts}</p>
          <p className="text-sm text-zinc-400">Total Workouts</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4">
          <FireIcon className="w-8 h-8 text-orange-400 mb-2" />
          <p className="text-3xl font-bold">{avgWorkoutsPerWeek}</p>
          <p className="text-sm text-zinc-400">Workouts/Week</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4">
          <ChartLineIcon className="w-8 h-8 text-green-400 mb-2" />
          <p className="text-3xl font-bold">{personalRecords.length}</p>
          <p className="text-sm text-zinc-400">Personal Records</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4">
          <span className="text-3xl mb-2 block">🥗</span>
          <p className="text-3xl font-bold">{nutritionConsistency}%</p>
          <p className="text-sm text-zinc-400">Nutrition Consistency</p>
        </div>
      </div>

      {/* Most Improved Exercise */}
      {mostImproved && (
        <div className="bg-gradient-to-br from-green-900/30 to-zinc-900 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🚀</span>
            <h2 className="text-xl font-bold text-green-400">Most Improved</h2>
          </div>
          <p className="text-2xl font-bold">{mostImproved.name}</p>
          <p className="text-lg text-green-400">+{mostImproved.improvement.toFixed(1)}% progress</p>
          <p className="text-sm text-zinc-400 mt-1">Over the last 4 weeks</p>
        </div>
      )}

      {/* Volume Chart */}
      <div className="bg-zinc-900 rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">Weekly Volume</h2>
        <p className="text-sm text-zinc-400 mb-4">Total weight lifted (lbs × reps)</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeByWeek} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="week" stroke="#a1a1aa" fontSize={11} />
              <YAxis stroke="#a1a1aa" fontSize={11} />
              <Tooltip
                contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46'}}
                formatter={(value: number) => [value.toLocaleString(), 'Volume']}
              />
              <Bar dataKey="volume">
                {volumeByWeek.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#22c55e" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consistency Chart */}
      <div className="bg-zinc-900 rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">Workout Consistency</h2>
        <p className="text-sm text-zinc-400 mb-4">Workouts per week (last 12 weeks)</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={consistencyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="week" stroke="#a1a1aa" fontSize={11} />
              <YAxis stroke="#a1a1aa" fontSize={11} />
              <Tooltip
                contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46'}}
                labelFormatter={() => ''}
                formatter={(value: number) => [value, 'Workouts']}
              />
              <Line type="monotone" dataKey="workouts" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Personal Records */}
      {personalRecords.length > 0 && (
        <div className="bg-zinc-900 rounded-2xl p-4">
          <h2 className="text-xl font-bold mb-4">Recent Personal Records</h2>
          <div className="space-y-3">
            {personalRecords.map((pr, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-zinc-800 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-white">{pr.name}</p>
                  <p className="text-sm text-zinc-400">
                    {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{pr.weight} lbs</p>
                  <p className="text-sm text-zinc-400">× {pr.reps} reps</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-purple-900/30 to-zinc-900 rounded-2xl p-6 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💡</span>
          <h2 className="text-xl font-bold text-purple-400">AI Insights</h2>
        </div>
        {totalWorkouts === 0 ? (
          <p className="text-zinc-300">Complete your first workout to see personalized insights!</p>
        ) : (
          <div className="space-y-2">
            {avgWorkoutsPerWeek >= 3 ? (
              <p className="text-zinc-300">✅ Excellent consistency! You're averaging {avgWorkoutsPerWeek} workouts per week.</p>
            ) : (
              <p className="text-zinc-300">💪 Try to hit 3-4 workouts per week for optimal progress.</p>
            )}
            {mostImproved && (
              <p className="text-zinc-300">🎯 Your {mostImproved.name} is improving rapidly! Keep up the great work.</p>
            )}
            {nutritionConsistency >= 80 ? (
              <p className="text-zinc-300">🥗 Outstanding nutrition tracking! You're hitting your targets {nutritionConsistency}% of the time.</p>
            ) : (
              <p className="text-zinc-300">🍽️ Focus on hitting your macro targets more consistently for better results.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
