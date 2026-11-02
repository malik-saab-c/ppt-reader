import React, { useState, useEffect, useCallback } from 'react';
import { Presentation, Slide, SlideElement } from './types/presentation';
import {
  createSamplePresentation,
  createDefaultTemplateSlide,
  parsePptxFile,
  exportToPptxBlob
} from './utils/pptxEngine';
import { savePresentationToDownloads } from './utils/mobileDownload';
import { MinimalNavigation } from './components/MinimalNavigation';
import { SlideViewer } from './components/SlideViewer';
import { SlideThumbnailStrip } from './components/SlideThumbnailStrip';
import { SlideEditorPanel } from './components/SlideEditorPanel';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { X, Maximize2, Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [presentation, setPresentation] = useState<Presentation>(() => createSamplePresentation());
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [mode, setMode] = useState<'reader' | 'editor' | 'mobile-preview'>('reader');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);

  const currentSlide: Slide = presentation.slides[currentSlideIndex] || presentation.slides[0];
  const selectedElement = currentSlide?.elements.find((el) => el.id === selectedElementId) || null;

  // Slide navigation
  const handlePrevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
    setSelectedElementId(null);
  }, []);

  const handleNextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(presentation.slides.length - 1, prev + 1));
    setSelectedElementId(null);
  }, [presentation.slides.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Space') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrevSlide();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextSlide, handlePrevSlide, isFullscreen]);

  // Upload and parse real PPTX / PPT file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parsePptxFile(file);
      setPresentation(parsed);
      setCurrentSlideIndex(0);
      setSelectedElementId(null);
      setSaveMessage(`Loaded "${parsed.title}" with ${parsed.slides.length} slides.`);
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      alert('Could not parse file. Ensure it is a valid PPT or PPTX file.');
    }
    e.target.value = '';
  };

  // Add new slide
  const handleAddSlide = () => {
    const newSlideNum = presentation.slides.length + 1;
    const newSlide = createDefaultTemplateSlide(newSlideNum);
    setPresentation((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
      lastModified: new Date().toISOString()
    }));
    setCurrentSlideIndex(presentation.slides.length);
    setSelectedElementId(null);
  };

  // Delete current slide
  const handleDeleteCurrentSlide = () => {
    if (presentation.slides.length <= 1) return;
    const updated = presentation.slides.filter((_, idx) => idx !== currentSlideIndex);
    setPresentation((prev) => ({
      ...prev,
      slides: updated.map((s, i) => ({ ...s, slideNumber: i + 1 })),
      lastModified: new Date().toISOString()
    }));
    setCurrentSlideIndex((prev) => Math.min(prev, updated.length - 1));
    setSelectedElementId(null);
  };

  // Save directly to mobile downloads
  const handleSaveToDownloads = async () => {
    setIsSaving(true);
    try {
      const blob = await exportToPptxBlob(presentation);
      const res = await savePresentationToDownloads(blob, presentation.title);
      if (res.success) {
        setSaveMessage(`Successfully saved to device ${res.pathName}!`);
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  // Update slide element
  const handleUpdateElement = (updated: SlideElement) => {
    setPresentation((prev) => {
      const updatedSlides = [...prev.slides];
      const targetSlide = { ...updatedSlides[currentSlideIndex] };
      targetSlide.elements = targetSlide.elements.map((el) =>
        el.id === updated.id ? updated : el
      );
      updatedSlides[currentSlideIndex] = targetSlide;
      return { ...prev, slides: updatedSlides, lastModified: new Date().toISOString() };
    });
  };

  // Add element to current slide
  const handleAddElement = (el: SlideElement) => {
    setPresentation((prev) => {
      const updatedSlides = [...prev.slides];
      const targetSlide = { ...updatedSlides[currentSlideIndex] };
      targetSlide.elements = [...targetSlide.elements, el];
      updatedSlides[currentSlideIndex] = targetSlide;
      return { ...prev, slides: updatedSlides, lastModified: new Date().toISOString() };
    });
    setSelectedElementId(el.id);
  };

  // Delete element from current slide
  const handleDeleteElement = (id: string) => {
    setPresentation((prev) => {
      const updatedSlides = [...prev.slides];
      const targetSlide = { ...updatedSlides[currentSlideIndex] };
      targetSlide.elements = targetSlide.elements.filter((el) => el.id !== id);
      updatedSlides[currentSlideIndex] = targetSlide;
      return { ...prev, slides: updatedSlides, lastModified: new Date().toISOString() };
    });
    setSelectedElementId(null);
  };

  // Update slide background
  const handleUpdateSlideBackground = (color: string) => {
    setPresentation((prev) => {
      const updatedSlides = [...prev.slides];
      const targetSlide = { ...updatedSlides[currentSlideIndex] };
      targetSlide.background = { type: 'solid', color };
      updatedSlides[currentSlideIndex] = targetSlide;
      return { ...prev, slides: updatedSlides, lastModified: new Date().toISOString() };
    });
  };

  // Presentation Fullscreen Mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none">
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
          title="Exit Fullscreen (Esc)"
        >
          <X size={20} />
        </button>

        <div className="w-full h-full flex items-center justify-center">
          <SlideViewer
            slide={currentSlide}
            canvasWidth={presentation.width}
            canvasHeight={presentation.height}
            onPrevSlide={handlePrevSlide}
            onNextSlide={handleNextSlide}
          />
        </div>

        {/* Minimal bottom presenter HUD */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs flex items-center gap-4">
          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex <= 0}
            className="disabled:opacity-30 cursor-pointer"
          >
            Previous
          </button>
          <span>
            {currentSlideIndex + 1} / {presentation.slides.length}
          </span>
          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex >= presentation.slides.length - 1}
            className="disabled:opacity-30 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden text-slate-900 font-sans">
      {/* Sleek Minimalist Top Navigation Menu */}
      <MinimalNavigation
        title={presentation.title}
        onUpdateTitle={(title) => setPresentation((p) => ({ ...p, title }))}
        currentSlideIndex={currentSlideIndex}
        totalSlides={presentation.slides.length}
        mode={mode}
        onChangeMode={setMode}
        onPrevSlide={handlePrevSlide}
        onNextSlide={handleNextSlide}
        onUploadFile={handleFileUpload}
        onAddSlide={handleAddSlide}
        onDeleteCurrentSlide={handleDeleteCurrentSlide}
        onSaveToDownloads={handleSaveToDownloads}
        onOpenFullscreen={() => setIsFullscreen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        isSaving={isSaving}
        saveMessage={saveMessage}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Slide Thumbnails (Desktop) */}
        <div className="hidden md:block">
          <SlideThumbnailStrip
            slides={presentation.slides}
            currentSlideIndex={currentSlideIndex}
            onSelectSlide={(idx) => {
              setCurrentSlideIndex(idx);
              setSelectedElementId(null);
            }}
            onAddSlide={handleAddSlide}
            orientation="vertical"
          />
        </div>

        {/* Center Presentation Slide Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative pb-14 sm:pb-0">
          {/* Mobile Preview Frame vs Standard View */}
          {mode === 'mobile-preview' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="text-center mb-2">
                <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
                  Mobile Device Screen Simulation (390 x 844) • Zero Glitch Verified
                </span>
              </div>
              {/* Smartphone Bezel */}
              <div className="w-[340px] sm:w-[380px] h-[640px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700 flex flex-col relative overflow-hidden">
                {/* Dynamic Island / Speaker notch */}
                <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2" />
                {/* Screen Content */}
                <div className="flex-1 bg-white rounded-[32px] overflow-hidden flex flex-col">
                  {/* In-app top minimal bar in mobile */}
                  <div className="h-10 px-4 bg-white border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-800">
                    <span>PurePPT Mobile</span>
                    <span>{currentSlideIndex + 1} / {presentation.slides.length}</span>
                  </div>
                  {/* Flawless responsive slide view */}
                  <div className="flex-1 overflow-hidden">
                    <SlideViewer
                      slide={currentSlide}
                      canvasWidth={presentation.width}
                      canvasHeight={presentation.height}
                      isEditing={false}
                      onPrevSlide={handlePrevSlide}
                      onNextSlide={handleNextSlide}
                    />
                  </div>
                  {/* In-app mobile bottom bar */}
                  <div className="h-12 px-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                    <button
                      onClick={handlePrevSlide}
                      disabled={currentSlideIndex <= 0}
                      className="disabled:opacity-30 font-medium"
                    >
                      ‹ Prev
                    </button>
                    <span className="text-[11px] text-slate-500 font-mono">Swipe Left/Right</span>
                    <button
                      onClick={handleNextSlide}
                      disabled={currentSlideIndex >= presentation.slides.length - 1}
                      className="disabled:opacity-30 font-medium"
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <SlideViewer
              slide={currentSlide}
              canvasWidth={presentation.width}
              canvasHeight={presentation.height}
              isEditing={mode === 'editor'}
              selectedElementId={selectedElementId}
              onSelectElement={(el) => setSelectedElementId(el ? el.id : null)}
              onUpdateElement={handleUpdateElement}
              onPrevSlide={handlePrevSlide}
              onNextSlide={handleNextSlide}
            />
          )}

          {/* Bottom Slide Thumbnail Strip on Mobile screens */}
          <div className="md:hidden">
            <SlideThumbnailStrip
              slides={presentation.slides}
              currentSlideIndex={currentSlideIndex}
              onSelectSlide={(idx) => {
                setCurrentSlideIndex(idx);
                setSelectedElementId(null);
              }}
              onAddSlide={handleAddSlide}
              orientation="horizontal"
            />
          </div>
        </main>

        {/* Right Editor Panel (when in editor mode) */}
        {mode === 'editor' && (
          <SlideEditorPanel
            currentSlide={currentSlide}
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onAddElement={handleAddElement}
            onUpdateSlideBackground={handleUpdateSlideBackground}
          />
        )}
      </div>

      {/* Android Project & GitHub Actions APK Modal */}
      <AndroidProjectModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />
    </div>
  );
}
