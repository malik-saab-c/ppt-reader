import React from 'react';
import {
  FileUp,
  Download,
  Plus,
  Play,
  Edit3,
  BookOpen,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface MinimalNavigationProps {
  title: string;
  onUpdateTitle: (newTitle: string) => void;
  currentSlideIndex: number;
  totalSlides: number;
  mode: 'reader' | 'editor' | 'mobile-preview';
  onChangeMode: (mode: 'reader' | 'editor' | 'mobile-preview') => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddSlide: () => void;
  onDeleteCurrentSlide: () => void;
  onSaveToDownloads: () => void;
  onOpenFullscreen: () => void;
  onOpenAndroidModal: () => void;
  isSaving?: boolean;
  saveMessage?: string | null;
}

export const MinimalNavigation: React.FC<MinimalNavigationProps> = ({
  title,
  onUpdateTitle,
  currentSlideIndex,
  totalSlides,
  mode,
  onChangeMode,
  onPrevSlide,
  onNextSlide,
  onUploadFile,
  onAddSlide,
  onDeleteCurrentSlide,
  onSaveToDownloads,
  onOpenFullscreen,
  onOpenAndroidModal,
  isSaving = false,
  saveMessage = null
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Hidden file input for uploading real PPT/PPTX */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onUploadFile}
        accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
        className="hidden"
      />

      {/* Main Top Header - Pure White Minimalist Theme */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Left: Brand & Editable Deck Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              PPT
            </div>
            <span className="font-semibold text-slate-900 text-sm hidden md:inline">PurePPT</span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block mx-1" />

          <input
            type="text"
            value={title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="text-sm font-medium text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-300 rounded px-2 py-1 outline-none transition-colors max-w-[140px] sm:max-w-[220px] md:max-w-[320px] truncate"
            title="Click to rename presentation"
            placeholder="Presentation Title"
          />
        </div>

        {/* Center: Slide Counter and Pagination (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <button
            onClick={onPrevSlide}
            disabled={currentSlideIndex <= 0}
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title="Previous Slide"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-xs font-semibold text-slate-700 px-2 min-w-[55px] text-center">
            {currentSlideIndex + 1} / {totalSlides}
          </span>

          <button
            onClick={onNextSlide}
            disabled={currentSlideIndex >= totalSlides - 1}
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title="Next Slide"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Center-Right: Mode Selector */}
        <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => onChangeMode('reader')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              mode === 'reader'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen size={13} />
            <span>Reader</span>
          </button>
          <button
            onClick={() => onChangeMode('editor')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              mode === 'editor'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 size={13} />
            <span>Editor</span>
          </button>
          <button
            onClick={() => onChangeMode('mobile-preview')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              mode === 'mobile-preview'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone size={13} />
            <span>Mobile View</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Upload PPTX */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            title="Upload PPT / PPTX file"
          >
            <FileUp size={14} />
            <span className="hidden sm:inline">Upload PPTX</span>
          </button>

          {/* Add Slide */}
          <button
            onClick={onAddSlide}
            className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Add New Slide"
          >
            <Plus size={16} />
          </button>

          {/* Delete Current Slide */}
          {totalSlides > 1 && (
            <button
              onClick={onDeleteCurrentSlide}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Slide"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Save directly to Downloads Folder */}
          <button
            onClick={onSaveToDownloads}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-60"
            title="Save PPTX file directly to Mobile Downloads folder"
          >
            <Download size={14} />
            <span>{isSaving ? 'Saving...' : 'Save to Downloads'}</span>
          </button>

          {/* Fullscreen Presentation */}
          <button
            onClick={onOpenFullscreen}
            className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer hidden sm:block"
            title="Present Fullscreen"
          >
            <Play size={16} />
          </button>

          {/* Android App & GitHub Actions APK Modal */}
          <button
            onClick={onOpenAndroidModal}
            className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-2 rounded-lg transition-colors cursor-pointer"
            title="View Android App Source & GitHub Actions APK Builder"
          >
            <GitBranch size={13} />
            <span className="hidden md:inline">Android APK</span>
          </button>
        </div>
      </header>

      {/* Save Status Banner */}
      {saveMessage && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>{saveMessage}</span>
          </div>
        </div>
      )}

      {/* Mobile Bottom Minimal Navigation Menu */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 flex items-center justify-between z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <button
          onClick={onPrevSlide}
          disabled={currentSlideIndex <= 0}
          className="p-2 text-slate-700 disabled:opacity-25"
          title="Previous Slide"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {currentSlideIndex + 1} / {totalSlides}
          </span>
          <button
            onClick={() => onChangeMode(mode === 'editor' ? 'reader' : 'editor')}
            className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              mode === 'editor'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            {mode === 'editor' ? 'Editing' : 'Reader'}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onAddSlide}
            className="p-2 text-slate-700 hover:text-slate-900"
            title="Add Slide"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={onSaveToDownloads}
            className="p-2 text-slate-900"
            title="Save to Downloads"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onNextSlide}
            disabled={currentSlideIndex >= totalSlides - 1}
            className="p-2 text-slate-700 disabled:opacity-25"
            title="Next Slide"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </nav>
    </>
  );
};
