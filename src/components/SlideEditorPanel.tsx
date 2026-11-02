import React, { useRef } from 'react';
import { Slide, SlideElement } from '../types/presentation';
import {
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Trash2
} from 'lucide-react';

interface SlideEditorPanelProps {
  currentSlide: Slide;
  selectedElement: SlideElement | null;
  onUpdateElement: (updated: SlideElement) => void;
  onDeleteElement: (id: string) => void;
  onAddElement: (el: SlideElement) => void;
  onUpdateSlideBackground: (color: string) => void;
}

export const SlideEditorPanel: React.FC<SlideEditorPanelProps> = ({
  currentSlide,
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
  onUpdateSlideBackground
}) => {
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const handleAddTextBox = () => {
    const newText: SlideElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: 100,
      y: 150,
      width: 400,
      height: 60,
      zIndex: currentSlide.elements.length + 1,
      text: 'Click to edit text',
      fontSize: 24,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#0F172A',
      textAlign: 'left'
    };
    onAddElement(newText);
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle') => {
    const newShape: SlideElement = {
      id: `shape_${Date.now()}`,
      type: 'shape',
      shapeType,
      x: 150,
      y: 180,
      width: 200,
      height: shapeType === 'circle' ? 200 : 120,
      zIndex: 0,
      fillColor: '#F1F5F9',
      strokeColor: '#CBD5E1',
      strokeWidth: 1.5
    };
    onAddElement(newShape);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const newImg: SlideElement = {
        id: `img_${Date.now()}`,
        type: 'image',
        x: 120,
        y: 120,
        width: 320,
        height: 220,
        zIndex: currentSlide.elements.length + 1,
        src
      };
      onAddElement(newImg);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <aside className="w-full sm:w-72 bg-white border-l border-slate-200 p-4 flex flex-col gap-5 overflow-y-auto z-20 text-xs">
      <input
        type="file"
        ref={imageUploadRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Insert Tools */}
      <div>
        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2.5">
          Insert Element
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAddTextBox}
            className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            <Type size={14} className="text-blue-600" />
            <span>Text Box</span>
          </button>

          <button
            onClick={() => imageUploadRef.current?.click()}
            className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            <ImageIcon size={14} className="text-emerald-600" />
            <span>Image</span>
          </button>

          <button
            onClick={() => handleAddShape('rectangle')}
            className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            <Square size={14} className="text-indigo-600" />
            <span>Box Shape</span>
          </button>

          <button
            onClick={() => handleAddShape('circle')}
            className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            <Circle size={14} className="text-amber-600" />
            <span>Circle Shape</span>
          </button>
        </div>
      </div>

      {/* Selected Element Formatting */}
      {selectedElement ? (
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Edit {selectedElement.type}
            </span>
            <button
              onClick={() => onDeleteElement(selectedElement.id)}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete Element"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Text Controls */}
          {selectedElement.type === 'text' && (
            <div className="space-y-3">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Text Content</label>
                <textarea
                  value={selectedElement.text || ''}
                  onChange={(e) =>
                    onUpdateElement({ ...selectedElement, text: e.target.value })
                  }
                  rows={3}
                  className="w-full p-2 border border-slate-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 resize-none font-sans"
                />
              </div>

              {/* Font Size & Weight */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-slate-600 font-medium block mb-1">Font Size</label>
                  <input
                    type="number"
                    min={10}
                    max={96}
                    value={selectedElement.fontSize || 20}
                    onChange={(e) =>
                      onUpdateElement({
                        ...selectedElement,
                        fontSize: parseInt(e.target.value, 10) || 16
                      })
                    }
                    className="w-full p-1.5 border border-slate-200 rounded-md text-slate-800 outline-none"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-slate-600 font-medium block mb-1">Color</label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-md p-1">
                    <input
                      type="color"
                      value={selectedElement.color || '#0F172A'}
                      onChange={(e) =>
                        onUpdateElement({ ...selectedElement, color: e.target.value })
                      }
                      className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-[11px] font-mono text-slate-700">
                      {selectedElement.color || '#0F172A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formatting Toggles */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
                <button
                  onClick={() =>
                    onUpdateElement({
                      ...selectedElement,
                      fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold'
                    })
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    selectedElement.fontWeight === 'bold'
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Bold"
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() =>
                    onUpdateElement({
                      ...selectedElement,
                      fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic'
                    })
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    selectedElement.fontStyle === 'italic'
                      ? 'bg-white text-blue-600 shadow-xs italic'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Italic"
                >
                  <Italic size={14} />
                </button>
                <button
                  onClick={() =>
                    onUpdateElement({ ...selectedElement, textAlign: 'left' })
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    selectedElement.textAlign === 'left' || !selectedElement.textAlign
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Align Left"
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  onClick={() =>
                    onUpdateElement({ ...selectedElement, textAlign: 'center' })
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    selectedElement.textAlign === 'center'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Align Center"
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  onClick={() =>
                    onUpdateElement({ ...selectedElement, textAlign: 'right' })
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    selectedElement.textAlign === 'right'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Align Right"
                >
                  <AlignRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Shape Controls */}
          {selectedElement.type === 'shape' && (
            <div className="space-y-3">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Fill Color</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-md p-1">
                  <input
                    type="color"
                    value={selectedElement.fillColor || '#F1F5F9'}
                    onChange={(e) =>
                      onUpdateElement({ ...selectedElement, fillColor: e.target.value })
                    }
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-[11px] font-mono text-slate-700">
                    {selectedElement.fillColor || '#F1F5F9'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Border Color</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-md p-1">
                  <input
                    type="color"
                    value={selectedElement.strokeColor || '#CBD5E1'}
                    onChange={(e) =>
                      onUpdateElement({ ...selectedElement, strokeColor: e.target.value })
                    }
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-[11px] font-mono text-slate-700">
                    {selectedElement.strokeColor || '#CBD5E1'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-slate-100 pt-4 text-center py-4 text-slate-400">
          <p>Tap any text or shape on the slide to edit formatting</p>
        </div>
      )}

      {/* Slide Background Setting */}
      <div className="border-t border-slate-100 pt-4 mt-auto">
        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
          <Palette size={13} />
          <span>Slide Background</span>
        </h3>
        <div className="flex items-center gap-2">
          {['#FFFFFF', '#F8FAFC', '#EFF6FF', '#F0FDF4', '#FEFCE8'].map((c) => (
            <button
              key={c}
              onClick={() => onUpdateSlideBackground(c)}
              style={{ backgroundColor: c }}
              className={`w-7 h-7 rounded-md border transition-transform ${
                currentSlide.background.color === c
                  ? 'border-blue-600 scale-110 shadow-xs'
                  : 'border-slate-300 hover:scale-105'
              }`}
              title={c}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};
