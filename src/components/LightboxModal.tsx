import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Image as ImageIcon, Calendar, Folder, CheckSquare } from 'lucide-react';
import { AttachedFile } from '../types';

interface LightboxModalProps {
  file: AttachedFile | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ file, onClose }) => {
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!file) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  return (
    <div 
      id="lightbox-modal-backdrop"
      className="fixed inset-0 z-70 bg-black/90 flex flex-col items-center justify-between p-4 select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div 
        className="w-full max-w-5xl flex items-center justify-between py-2.5 px-4 bg-[#1A1918] border border-[#2E2D2B] rounded-xl text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-medium text-white truncate">
              {file.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#9D9C98]">
              <span className="font-mono tabular-nums">{file.sizeFormatted}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {file.entityType === 'calendar' && <Calendar className="w-3 h-3 text-[#D6D4CF]" />}
                {file.entityType === 'project' && <Folder className="w-3 h-3 text-[#D6D4CF]" />}
                {file.entityType === 'task' && <CheckSquare className="w-3 h-3 text-[#D6D4CF]" />}
                <span>{file.entityName}</span>
              </span>
              <span>•</span>
              <span>{file.uploadedAt}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-1.5 rounded-lg text-[#9D9C98] hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors duration-200 cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono tabular-nums text-[#D6D4CF] w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-1.5 rounded-lg text-[#9D9C98] hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors duration-200 cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-[#9D9C98] hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="text-[#4D4C48] mx-1">|</span>

          <a
            href={file.url}
            download={file.name}
            onClick={(e) => {
              if (file.url.startsWith('http') || file.url.startsWith('data:')) {
                // allow default download
              } else {
                e.preventDefault();
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-[#1A1918] hover:bg-[#FAF9F7] text-xs font-medium transition-colors duration-200 cursor-pointer"
            title="Download image"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9D9C98] hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer ml-1"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div 
        className="flex-1 w-full max-w-5xl flex items-center justify-center p-4 overflow-hidden"
        onClick={onClose}
      >
        <div 
          className="transition-transform duration-150 flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={file.url}
            alt={file.name}
            className="max-h-[78vh] max-w-[88vw] object-contain rounded-lg border border-white/10"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Footer Info */}
      <div 
        className="text-xs text-[#9D9C98] py-1"
        onClick={(e) => e.stopPropagation()}
      >
        Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/15 text-[11px] font-mono">Esc</kbd> to close · Click anywhere outside to dismiss
      </div>
    </div>
  );
};
