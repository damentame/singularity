import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, ZoomIn, Download, Grid3X3,
  Loader2, ImageOff, Maximize2
} from 'lucide-react';

interface PortfolioGalleryProps {
  images: string[];
  providerName?: string;
  columns?: 2 | 3 | 4;
}

const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  images,
  providerName = 'Provider',
  columns = 3,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [isZoomed, setIsZoomed] = useState(false);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    setIsZoomed(false);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setIsZoomed(false);
    document.body.style.overflow = '';
  };

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'Escape':
          closeLightbox();
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, goNext, goPrev]);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  if (!images || images.length === 0) {
    return null;
  }

  const colClass =
    columns === 2
      ? 'grid-cols-2'
      : columns === 4
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-2 md:grid-cols-3';

  return (
    <>
      {/* Gallery Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-navy font-semibold flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-gold" />
            Portfolio
          </h2>
          <span className="text-sm text-gray-500 font-body">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className={`grid ${colClass} gap-3`}>
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative group aspect-[4/3] rounded-xl overflow-hidden cursor-pointer bg-gray-100 border border-gray-200"
              onClick={() => !failedImages.has(index) && openLightbox(index)}
            >
              {/* Loading skeleton */}
              {!loadedImages.has(index) && !failedImages.has(index) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                  <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
              )}

              {/* Failed state */}
              {failedImages.has(index) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                  <ImageOff className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-xs text-gray-400">Failed to load</span>
                </div>
              )}

              {/* Image */}
              {!failedImages.has(index) && (
                <img
                  src={url}
                  alt={`${providerName} portfolio ${index + 1}`}
                  className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                    loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
                  }`}
                  loading="lazy"
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                />
              )}

              {/* Hover overlay */}
              {!failedImages.has(index) && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-navy" />
                    </div>
                  </div>
                </div>
              )}

              {/* Image number badge */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full font-body opacity-0 group-hover:opacity-100 transition-opacity">
                {index + 1} / {images.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation - Previous */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Navigation - Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Main image */}
          <div
            className={`relative max-w-[90vw] max-h-[85vh] transition-transform duration-300 ${
              isZoomed ? 'cursor-zoom-out scale-150' : 'cursor-zoom-in'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
          >
            <img
              src={images[lightboxIndex]}
              alt={`${providerName} portfolio ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-6 px-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              {/* Counter */}
              <div className="text-white font-body">
                <span className="text-lg font-medium">{lightboxIndex + 1}</span>
                <span className="text-white/60 mx-1">/</span>
                <span className="text-white/60">{images.length}</span>
              </div>

              {/* Provider name */}
              <div className="text-white/70 font-body text-sm">
                {providerName} — Portfolio
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(!isZoomed);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  title="Zoom"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <a
                  href={images[lightboxIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  title="Open in new tab"
                >
                  <Download className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="max-w-4xl mx-auto mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(idx);
                      setIsZoomed(false);
                    }}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === lightboxIndex
                        ? 'border-gold opacity-100 scale-105'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PortfolioGallery;
