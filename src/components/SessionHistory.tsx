import { type FC } from 'react';
import { generatePDF, generateCSV } from '../utils/reporting';
import type { SessionLog } from '../utils/reporting';

export const SessionHistory: FC<{ sessions: SessionLog[] }> = ({ sessions }) => {
  if (sessions.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-900">Session History</h3>
        <div className="flex gap-2">
            <button 
                onClick={() => generateCSV(sessions)}
                className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition-colors"
            >
                Export CSV
            </button>
            <button 
                onClick={() => generatePDF(sessions)}
                className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
                Download PDF
            </button>
        </div>
      </div>
      
      <div className="max-h-60 overflow-y-auto">
        <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Settings</th>
                </tr>
            </thead>
            <tbody>
                {sessions.slice().reverse().map((session) => (
                    <tr key={session.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{session.date}</td>
                        <td className="px-6 py-4">{session.startTime}</td>
                        <td className="px-6 py-4">{Math.round(session.duration)}s</td>
                        <td className="px-6 py-4">
                            Imb: {session.settings.imbalance}, Noise: {session.settings.noiseType}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

