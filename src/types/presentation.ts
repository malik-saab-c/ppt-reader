export interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'table';
  x: number; // in slide coordinate units (default slide width 960)
  y: number; // in slide coordinate units (default slide height 540)
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '600' | '700' | '800';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  isTitle?: boolean;
  bulletPoints?: string[];
  
  // Shape specific
  shapeType?: 'rectangle' | 'rounded-rect' | 'circle' | 'arrow' | 'callout' | 'line';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  borderRadius?: number;
  
  // Image specific
  src?: string; // data URL or object URL
  imageName?: string;
  aspectRatio?: number;
  objectFit?: 'contain' | 'cover' | 'fill';
}

export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: {
    angle: number;
    colors: string[];
  };
  imageSrc?: string;
}

export interface Slide {
  id: string;
  slideNumber: number;
  notes?: string;
  background: SlideBackground;
  elements: SlideElement[];
  transition?: 'none' | 'fade' | 'slide' | 'zoom';
}

export interface Presentation {
  id: string;
  title: string;
  author?: string;
  createdDate: string;
  lastModified: string;
  width: number;  // standard 960 (16:9 widescreen)
  height: number; // standard 540
  aspectRatio: '16:9' | '4:3' | 'custom';
  slides: Slide[];
}
