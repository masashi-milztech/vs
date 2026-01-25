
import React from 'react';
import { PlanType, PLAN_DETAILS } from '../types';

interface PlanCardProps {
  type: PlanType;
  isSelected: boolean;
  onSelect: (type: PlanType) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ type, isSelected, onSelect }) => {
  const details = PLAN_DETAILS[type];

  return (
    <button
      onClick={() => onSelect(type)}
      className={`group relative flex flex-col p-8 text-left transition-all duration-500 rounded-[2.5rem] border-2 ${
        isSelected 
          ? 'bg-slate-900 border-slate-900 text-white plan-selected z-10' 
          : 'bg-white border-transparent text-slate-800 hover:border-slate-200'
      }`}
    >
      <div className="flex justify-between items-start mb-8">
        <div className={`w-14 h-14 flex items-center justify-center rounded-2xl text-2xl shadow-inner transition-colors duration-300 ${
          isSelected ? 'bg-white/10' : 'bg-slate-100'
        }`}>
          {details.icon}
        </div>
        {isSelected && (
          <div className="bg-emerald-400 text-slate-900 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            Best Value
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight jakarta">
          {details.title}
        </h3>
        <p className={`text-xs leading-relaxed font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
          {details.description}
        </p>
      </div>

      <div className={`mt-8 flex items-center justify-between border-t pt-6 ${isSelected ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black tracking-tighter jakarta">{details.price}</span>
          <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>/ photo</span>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected ? 'border-white bg-white' : 'border-slate-200 bg-transparent'
        }`}>
          {isSelected && (
            <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
};
