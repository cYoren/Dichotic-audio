import { useRef, useState, type FC, type ChangeEvent } from 'react';
import { Accordion } from './ui/Accordion/Accordion';
import { stockLibrary } from '../data/stockLibrary';
import type { StockItem } from '../data/stockLibrary';

interface TrackStatus {
  left: boolean;
  right: boolean;
}

interface AudioInputsPanelProps {
  mode: 'user' | 'clinical';
  trackStatus: TrackStatus;
  onFileLoad: (side: 'left' | 'right', file: File) => Promise<void>;
  // onUrlLoad kept for legacy or direct URL if needed, but primarily for stock now
  onUrlLoad?: (side: 'left' | 'right', url: string) => Promise<void>; 
  onStockSelect: (side: 'left' | 'right', item: StockItem) => Promise<void>;
  onTextSubmit: (side: 'left' | 'right', text: string) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
}

const SingleInput: FC<{
  side: 'left' | 'right';
  mode: 'user' | 'clinical';
  isLoaded: boolean;
  onFileSelect: (file: File) => void;
  onStockSelect: (item: StockItem) => void;
  onTextSubmit: (text: string) => void;
}> = ({ side, isLoaded, onFileSelect, onStockSelect, onTextSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStockId, setSelectedStockId] = useState<string>("");
  const [inputType, setInputType] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState("");

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        await onFileSelect(file);
        setSelectedStockId(""); // Clear stock selection if file uploaded
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStockChange = async (e: ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      setSelectedStockId(id);
      const item = stockLibrary.find(i => i.id === id);
      if (item) {
          setIsLoading(true);
          try {
              await onStockSelect(item);
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleTextSubmit = async () => {
      if (!textInput.trim()) return;
      setIsLoading(true);
      try {
          await onTextSubmit(textInput);
      } catch (e) {
          console.error(e);
          alert("Failed to convert text to speech.");
      } finally {
          setIsLoading(false);
      }
  };

  const label = side === 'left' ? 'Left Ear Audio' : 'Right Ear Audio';
  const accentColor = side === 'left' ? 'text-blue-600' : 'text-red-600';
  
  const status = isLoaded 
      ? { text: 'Loaded ✔', color: 'bg-green-100 text-green-700' }
      : { text: 'Not Loaded', color: 'bg-gray-100 text-gray-500' };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className={`font-medium ${accentColor}`}>{label}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
          {status.text}
        </span>
      </div>

      {/* Input Type Toggles */}
      <div className="flex gap-2 text-xs mb-2">
          <button 
            onClick={() => setInputType('file')}
            className={`px-3 py-1 rounded-full transition-colors ${inputType === 'file' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
              File / Library
          </button>
          <button 
            onClick={() => setInputType('text')}
            className={`px-3 py-1 rounded-full transition-colors ${inputType === 'text' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
              Paste Text
          </button>
      </div>

      {inputType === 'file' ? (
        <>
            {/* File Upload Button */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={`
                w-full py-3 px-4 rounded-lg border-2 border-dashed border-gray-200 
                flex items-center justify-center gap-2 transition-all
                ${isLoading ? 'opacity-50 cursor-wait' : 'hover:border-gray-300 hover:bg-gray-50'}
                `}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600 font-medium">
                {isLoading ? 'Loading...' : 'Upload Audio File'}
                </span>
            </button>
            
            <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Stock Library Selector */}
            <div className="mt-2 pt-2 border-t border-gray-100">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                    Or Choose from Library
                </label>
                <select
                    value={selectedStockId}
                    onChange={handleStockChange}
                    disabled={isLoading}
                    className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                >
                    <option value="">-- Select Text to Read --</option>
                    {stockLibrary.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.title}
                        </option>
                    ))}
                </select>
                {selectedStockId && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                    "{stockLibrary.find(i => i.id === selectedStockId)?.description}"
                    </p>
                )}
            </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
            <textarea 
                className="w-full p-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
                placeholder="Paste text here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
            />
            <button
                onClick={handleTextSubmit}
                disabled={isLoading || !textInput.trim()}
                className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Converting...' : 'Convert to Speech'}
            </button>
        </div>
      )}
    </div>
  );
};

export const AudioInputsPanel: FC<AudioInputsPanelProps> = ({
  mode, 
  trackStatus, 
  onFileLoad, 
  onStockSelect,
  onTextSubmit,
  isOpen, 
  onToggle 
}) => {
  return (
    <Accordion 
      title="Step 1: Audio Selection" 
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SingleInput 
          side="left" 
          mode={mode}
          isLoaded={trackStatus.left}
          onFileSelect={(f) => onFileLoad('left', f)}
          onStockSelect={(item) => onStockSelect('left', item)}
          onTextSubmit={(text) => onTextSubmit('left', text)}
        />
        <SingleInput 
          side="right" 
          mode={mode}
          isLoaded={trackStatus.right}
          onFileSelect={(f) => onFileLoad('right', f)}
          onStockSelect={(item) => onStockSelect('right', item)}
          onTextSubmit={(text) => onTextSubmit('right', text)}
        />
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 flex gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
         </svg>
         <p>
           Select an audio file, choose from the library, or paste your own text to be read aloud.
         </p>
      </div>
    </Accordion>
  );
};
