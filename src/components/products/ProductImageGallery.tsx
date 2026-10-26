"use client";

import { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { GARMENT_PHOTO_FALLBACK } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  name: string;
}

export default function ProductImageGallery({
  images,
  name,
}: ProductImageGalleryProps) {
  const cleaned = images.filter((img) => img && !img.includes("photo-1542272604-780c96856592"));
  const validImages = cleaned.length > 0 ? cleaned : [GARMENT_PHOTO_FALLBACK];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentImage = validImages[selectedIndex] || validImages[0];

  // In-page Hover Zoom
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  // Fullscreen Enlarge Lightbox
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalZoom, setModalZoom] = useState(1);
  const [modalPan, setModalPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const modalImageRef = useRef<HTMLDivElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thumbnailStripRef.current) {
      const activeBtn = thumbnailStripRef.current.children[selectedIndex] as HTMLElement;
      if (activeBtn && typeof activeBtn.scrollIntoView === "function") {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selectedIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMousePosition({ x, y });
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % validImages.length);
    resetModalView();
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    resetModalView();
  };

  const resetModalView = () => {
    setModalZoom(1);
    setModalPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setModalZoom((z) => Math.min(3.5, Number((z + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    setModalZoom((z) => {
      const next = Math.max(1, Number((z - 0.5).toFixed(1)));
      if (next === 1) setModalPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Keyboard navigation & body scroll lock in modal
  useEffect(() => {
    if (!isModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        resetModalView();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, validImages.length]);

  // Modal Pan (drag when zoomed)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalZoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - modalPan.x, y: e.clientY - modalPan.y });
  };

  const handleModalMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || modalZoom <= 1) return;
    setModalPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setModalZoom((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))));
    } else {
      setModalZoom((z) => {
        const next = Math.max(1, Number((z - 0.25).toFixed(2)));
        if (next === 1) setModalPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Main Image Display with Hover Zoom Lens - Box sizes dynamically to fit the image edge-to-edge */}
        <div
          onClick={() => {
            setIsModalOpen(true);
            resetModalView();
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setMousePosition({ x: 50, y: 50 });
          }}
          onMouseMove={handleMouseMove}
          className="relative w-full overflow-hidden rounded-2xl bg-gray-50 border border-gray-200/90 shadow-xs cursor-zoom-in group select-none flex items-center justify-center"
        >
          <img
            src={currentImage}
            alt={name}
            style={{
              transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
              transform: isHovering ? "scale(2.2)" : "scale(1)",
            }}
            className="w-full h-auto max-h-[750px] object-cover transition-transform duration-100 ease-out pointer-events-none block"
          />

          {/* Hover Lens Helper Badge */}
          <span className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-gray-800 text-xs font-semibold backdrop-blur-md border border-gray-200/80 shadow-xs pointer-events-none transition-opacity duration-200 opacity-90 group-hover:opacity-100">
            <Sparkles className="w-3.5 h-3.5 text-gray-600" />
            <span>Hover to zoom details</span>
          </span>

          {/* Active Photo Counter Badge */}
          {validImages.length > 1 && (
            <span className="absolute top-3.5 right-3.5 z-10 inline-flex items-center px-2.5 py-1 rounded-full bg-black/75 text-white text-xs font-medium font-mono backdrop-blur-md shadow-xs pointer-events-none">
              {selectedIndex + 1} / {validImages.length}
            </span>
          )}

          {/* Floating Navigation Arrows on Main Card */}
          {validImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-md border border-gray-200 transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer"
                title="Previous photo"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-md border border-gray-200 transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer"
                title="Next photo"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          )}

          {/* Click to Enlarge Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
              resetModalView();
            }}
            className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900/90 hover:bg-black text-white text-xs font-semibold backdrop-blur-md shadow-md transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-gray-200" />
            <span>Enlarge Fullscreen</span>
          </button>
        </div>

        {/* Thumbnails Strip */}
        {validImages.length > 1 && (
          <div
            ref={thumbnailStripRef}
            className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin scroll-smooth"
          >
            {validImages.map((img, index) => {
              const isSelected = selectedIndex === index;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(index);
                    resetModalView();
                  }}
                  className={`group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-gray-900 shadow-xs scale-102 ring-2 ring-gray-900/20"
                      : "border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-400"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${name} thumbnail ${index + 1}`}
                    className="h-full w-full object-contain object-center p-1 bg-white"
                  />
                  <span
                    className={`absolute bottom-1 right-1 text-[9px] font-mono px-1 py-0.2 rounded-md ${
                      isSelected
                        ? "bg-black text-white font-bold"
                        : "bg-black/60 text-white/90"
                    }`}
                  >
                    #{index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Enlarge Modal / Lightbox */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            setIsModalOpen(false);
            resetModalView();
          }}
        >
          {/* Top Bar: Title, Zoom Controls, Close */}
          <div
            className="flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-black/80 to-transparent z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-sm sm:text-base line-clamp-1 max-w-[200px] sm:max-w-md">
                {name}
              </span>
              <span className="text-xs text-gray-400 font-mono px-2 py-0.5 rounded-md bg-white/10">
                {selectedIndex + 1} / {validImages.length}
              </span>
            </div>

            {/* Interactive Zoom Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={modalZoom <= 1}
                title="Zoom Out (-)"
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={resetModalView}
                title="Reset Zoom (100%)"
                className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                {Math.round(modalZoom * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={modalZoom >= 3.5}
                title="Zoom In (+)"
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="w-px h-5 bg-white/20 mx-1" />

              <button
                type="button"
                onClick={resetModalView}
                title="Reset View"
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetModalView();
                }}
                title="Close (Esc)"
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-colors ml-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Central Viewing Stage with Drag / Pan & Wheel Zoom */}
          <div
            ref={modalImageRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleModalMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className={`relative flex-1 flex items-center justify-center overflow-hidden px-4 select-none ${
              modalZoom > 1
                ? isDragging
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-zoom-in"
            }`}
          >
            {/* Prev Button */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 sm:left-6 z-20 p-3 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all duration-150 active:scale-95"
                title="Previous Image (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Enlarged Image */}
            <div
              style={{
                transform: `scale(${modalZoom}) translate(${modalPan.x / modalZoom}px, ${modalPan.y / modalZoom}px)`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              onClick={() => {
                if (modalZoom === 1) {
                  setModalZoom(2);
                }
              }}
              className="max-h-[78vh] max-w-[85vw] flex items-center justify-center"
            >
              <img
                src={currentImage}
                alt={name}
                draggable={false}
                className="max-h-[78vh] max-w-[85vw] object-contain rounded-xl shadow-2xl pointer-events-none select-none"
              />
            </div>

            {/* Next Button */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 sm:right-6 z-20 p-3 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all duration-150 active:scale-95"
                title="Next Image (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Instruction Pill when Zoomed */}
            {modalZoom > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-black/75 text-gray-200 text-xs backdrop-blur-md border border-white/10 pointer-events-none">
                Click &amp; drag to pan • Scroll wheel to zoom
              </div>
            )}
          </div>

          {/* Bottom Bar: Thumbnails Strip */}
          <div
            className="flex items-center justify-center p-4 bg-gradient-to-t from-black/80 to-transparent z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {validImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto max-w-xl px-2 py-1 scrollbar-none">
                {validImages.map((img, index) => {
                  const isSelected = selectedIndex === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedIndex(index);
                        resetModalView();
                      }}
                      className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-white scale-105 shadow-md"
                          : "border-white/20 opacity-50 hover:opacity-90 hover:border-white/50"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumb ${index + 1}`}
                        className="h-full w-full object-cover object-center"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
