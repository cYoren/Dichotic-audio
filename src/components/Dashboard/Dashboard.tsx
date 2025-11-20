import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ReferenceLine
} from 'recharts';
import type { SessionLog } from '../../utils/reporting';

interface DashboardProps {
  sessions: SessionLog[];
}

export const Dashboard: React.FC<DashboardProps> = ({ sessions }) => {
  // Filter sessions that have metrics
  const data = useMemo(() => {
    return sessions
      .filter(s => s.metrics && (s.metrics.accuracy !== undefined || s.metrics.score !== undefined))
      .slice(-30) // Last 30 sessions
      .map(s => ({
        date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: s.date,
        accuracy: s.metrics?.accuracy || 0,
        leftAcc: s.metrics?.leftEarAccuracy || 0,
        rightAcc: s.metrics?.rightEarAccuracy || 0,
        earAdvantage: (s.metrics?.rightEarAccuracy || 0) - (s.metrics?.leftEarAccuracy || 0),
        mode: s.mode
      }));
  }, [sessions]);

  if (data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data Yet</h3>
        <p className="text-gray-500">Complete some sessions in DAT or Number Stream mode to see your progress trends.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Accuracy Trend */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Accuracy Trend (Last 30 Sessions)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickMargin={10} />
              <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} unit="%" />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                name="Overall Accuracy" 
                stroke="#4f46e5" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#4f46e5' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ear Advantage Trend */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Ear Advantage Trend</h3>
        <p className="text-sm text-gray-500 mb-6">
          Positive values indicate Right Ear advantage, negative values indicate Left Ear advantage.
          Goal is often to balance them (get close to 0).
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickMargin={10} />
              <YAxis stroke="#9ca3af" fontSize={12} domain={[-100, 100]} unit="%" />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <ReferenceLine y={0} stroke="#9ca3af" />
              <Bar dataKey="earAdvantage" name="Ear Advantage (R - L)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h4 className="font-bold text-indigo-900 mb-2">Recent Performance</h4>
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                  {Math.round(data[data.length - 1].accuracy)}%
              </div>
              <p className="text-sm text-indigo-700">Accuracy in last session</p>
          </div>
          
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
              <h4 className="font-bold text-emerald-900 mb-2">Sessions Completed</h4>
              <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {sessions.length}
              </div>
              <p className="text-sm text-emerald-700">Total practice sessions</p>
          </div>
      </div>
    </div>
  );
};

