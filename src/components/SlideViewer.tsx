import React, { useRef, useState, useEffect } from 'react';
import { Slide, SlideElement } from '../types/presentation';

interface SlideViewerProps {
  slide: Slide;
  canvasWidth?: number;
  canvasHeight?: number;
  isEditing?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (el: SlideElement | null) => void;
  onUpdateElement?: (updatedEl: SlideElement) => void;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  slide,
  canvasWidth = 960,
  canvasHeight = 540,
  isEditing = false,
  selectedElementId = null,
  onSelectElement,
  onUpdateElement,
  onPrevSlide,
  onNextSlide
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Auto-calculate scale to prevent any clipping, text cut-off, or overflow
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const padding = 24;
      const availableW = Math.max(rect.width - padding, 200);
      const availableH = Math.max(rect.height - padding, 150);

      const scaleX = availableW / canvasWidth;
      const scaleY = availableH / canvasHeight;
      const calculatedScale = Math.min(scaleX, scaleY);
      setScale(calculatedScale > 0 ? calculatedScale : 0.4);
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [canvasWidth, canvasHeight]);

  // Touch Swipe detection for smooth mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing) return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isEditing || touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 45) {
      if (diff > 0 && onNextSlide) {
        onNextSlide();
      } else if (diff < 0 && onPrevSlide) {
        onPrevSlide();
      }
    }
    setTouchStartX(null);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none bg-slate-50"
      onClick={() => onSelectElement && onSelectElement(null)}
    >
      <div
        style={{
          width: `${canvasWidth * scale}px`,
          height: `${canvasHeight * scale}px`,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        className="relative flex items-center justify-center transition-all duration-150 ease-out"
      >
        {/* Render Canvas with fixed coordinate space */}
        <div
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            backgroundColor: slide.background.color || '#FFFFFF',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          className="rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Elements */}
          {slide.elements.map((el) => {
            const isSelected = selectedElementId === el.id;

            return (
              <div
                key={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectElement) onSelectElement(el);
                }}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  zIndex: el.zIndex || 1,
                  cursor: isEditing ? 'pointer' : 'default'
                }}
                className={`transition-shadow ${
                  isEditing && isSelected
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white rounded'
                    : isEditing
                    ? 'hover:outline hover:outline-1 hover:outline-blue-300 rounded'
                    : ''
                }`}
              >
                {/* Text Element */}
                {el.type === 'text' && (
                  <div
                    style={{
                      fontSize: `${el.fontSize || 20}px`,
                      fontWeight: el.fontWeight || 'normal',
                      fontStyle: el.fontStyle || 'normal',
                      color: el.color || '#0F172A',
                      textAlign: el.textAlign || 'left',
                      lineHeight: 1.35,
                      fontFamily: el.fontFamily || 'inherit',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}
                    className="w-full h-full p-1"
                    contentEditable={isEditing && isSelected}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      if (onUpdateElement) {
                        onUpdateElement({
                          ...el,
                          text: e.currentTarget.innerText
                        });
                      }
                    }}
                  >
                    {el.text}
                  </div>
                )}

                {/* Shape Element */}
                {el.type === 'shape' && (
                  <div
                    style={{
                      backgroundColor: el.fillColor || '#F1F5F9',
                      borderColor: el.strokeColor || '#CBD5E1',
                      borderWidth: `${el.strokeWidth || 1}px`,
                      borderStyle: 'solid',
                      borderRadius: el.shapeType === 'circle' ? '9999px' : '8px'
                    }}
                    className="w-full h-full"
                  />
                )}

                {/* Image Element */}
                {el.type === 'image' && el.src && (
                  <img
                    src={el.src}
                    alt="Slide visual"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
