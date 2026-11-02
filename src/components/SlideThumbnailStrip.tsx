import React from 'react';
import { Slide } from '../types/presentation';
import { Plus } from 'lucide-react';

interface SlideThumbnailStripProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  orientation?: 'horizontal' | 'vertical';
}

export const SlideThumbnailStrip: React.FC<SlideThumbnailStripProps> = ({
  slides,
  currentSlideIndex,
  onSelectSlide,
  onAddSlide,
  orientation = 'horizontal'
}) => {
  return (
    <div
      className={`bg-white border-slate-200 select-none ${
        orientation === 'horizontal'
          ? 'h-24 border-t px-4 flex items-center gap-3 overflow-x-auto overflow-y-hidden'
          : 'w-48 border-r p-3 flex flex-col gap-3 overflow-y-auto overflow-x-hidden'
      }`}
    >
      {slides.map((slide, idx) => {
        const isCurrent = idx === currentSlideIndex;
        const titleEl = slide.elements.find((el) => el.type === 'text');

        return (
          <div
            key={slide.id}
            onClick={() => onSelectSlide(idx)}
            className={`relative flex-shrink-0 cursor-pointer rounded-md border transition-all ${
              isCurrent
                ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            } ${orientation === 'horizontal' ? 'w-32 h-18' : 'w-full h-24'}`}
          >
            {/* Slide Index Badge */}
            <span
              className={`absolute top-1 left-1.5 text-[10px] font-semibold px-1 rounded ${
                isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {idx + 1}
            </span>

            {/* Slide Micro-Preview representation */}
            <div className="w-full h-full p-2 pt-5 flex flex-col justify-start overflow-hidden bg-white rounded-md">
              <div className="text-[8px] font-bold text-slate-800 truncate leading-tight">
                {titleEl?.text?.slice(0, 24) || `Slide ${idx + 1}`}
              </div>
              <div className="mt-1 space-y-0.5">
                <div className="h-1 bg-slate-200 rounded w-4/5" />
                <div className="h-1 bg-slate-100 rounded w-3/5" />
              </div>
            </div>
          </div>
        );
      })}

      {/* Quick Add Slide Button in strip */}
      <button
        onClick={onAddSlide}
        className={`flex-shrink-0 border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer ${
          orientation === 'horizontal' ? 'w-18 h-18' : 'w-full h-14'
        }`}
        title="Add New Slide"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
