import { useState } from 'react';
import type { FC, ReactNode } from 'react';

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
  rightElement?: ReactNode;
}

export const Accordion: FC<AccordionProps> = ({ 
  title, 
  children, 
  defaultOpen = false, 
  isOpen: controlledIsOpen,
  onToggle,
  className = "",
  rightElement
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm ${className}`}>
      <button
        onClick={handleToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`transform transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        {rightElement && <div onClick={(e) => e.stopPropagation()}>{rightElement}</div>}
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 border-t border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};
