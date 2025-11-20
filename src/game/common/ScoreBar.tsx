import { type FC } from 'react';

interface ScoreBarProps {
  score: number;
  streak: number;
  xp: number;
}

export const ScoreBar: FC<ScoreBarProps> = ({ score, streak, xp }) => {
  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center space-x-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Score</span>
          <span className="text-xl font-bold text-gray-900">{score}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">XP</span>
          <span className="text-xl font-bold text-indigo-600">{xp}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${streak > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          <span className="font-bold">{streak}</span>
        </div>
      </div>
    </div>
  );
};

