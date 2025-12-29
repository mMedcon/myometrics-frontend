import { ReactElement, RefObject } from 'react';

declare module 'react-sketch-canvas' {
  export interface ReactSketchCanvasProps {
    width?: string | number;
    height?: string | number;
    strokeWidth?: number;
    strokeColor?: string;
    canvasColor?: string;
    style?: React.CSSProperties;
    className?: string;
    ref?: RefObject<ReactSketchCanvasRef>;
    [key: string]: any; // Allow for additional props
  }

  export interface ReactSketchCanvasRef {
    exportImage: (imageType: 'png' | 'jpeg' | 'svg') => Promise<string>;
    exportSvg: () => Promise<string>;
    clearCanvas: () => void;
    undo: () => void;
    redo: () => void;
    eraseMode: (erase: boolean) => void;
    resetCanvas: () => void;
    [key: string]: any; // Allow for additional methods
  }

  export const ReactSketchCanvas: React.FC<ReactSketchCanvasProps>;
}