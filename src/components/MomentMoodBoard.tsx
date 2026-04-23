import React, { useState, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Sparkles, Upload, Image, X, Loader2,
  ZoomIn, Wand2, BookOpen, Save, FolderOpen,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { saveTemplate } from '@/data/moodBoardTemplateStore';

const GOLD = '#C9A24A';

// Fallback placeholder images when AI generation fails
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
  'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800',
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
  'https://images.unsplash.com/photo-1555244162-803834f70033?w=800',
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800',
  'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
  'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=800',
];

export interface MoodBoardImage {
  id: string;
  url: string;
  caption: string;
  isAiGenerated: boolean;
  prompt?: string;
  sortOrder: number;
}

interface MomentMoodBoardProps {
  momentId: string;
  momentName: string;
  images: MoodBoardImage[];
  onImagesChange: (images: MoodBoardImage[]) => void;
  compact?: boolean;
  onBrowseTemplates?: () => void;
}

const MomentMoodBoard: React.FC<MomentMoodBoardProps> = ({
  momentId, momentName, images, onImagesChange, compact = false, onBrowseTemplates,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [previewImage, setPreviewImage] = useState<MoodBoardImage | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Custom');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uid = () => `mb-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: MoodBoardImage = {
          id: uid(),
          url: e.target?.result as string,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          isAiGenerated: false,
          sortOrder: images.length,
        };
        onImagesChange([...images, newImage]);
      };
      reader.readAsDataURL(file);
    });
  }, [images, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-mood-image', {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;

      if (data?.success && data?.imageUrl) {
        const newImage: MoodBoardImage = {
          id: uid(),
          url: data.imageUrl,
          caption: prompt.trim(),
          isAiGenerated: true,
          prompt: prompt.trim(),
          sortOrder: images.length,
        };
        onImagesChange([...images, newImage]);
        setPrompt('');
        setShowPrompt(false);
        toast({ title: 'Image Generated', description: 'AI image added to mood board.' });
      } else {
        throw new Error(data?.error || 'Generation service unavailable');
      }
    } catch (err: any) {
      console.warn('AI generation unavailable, using placeholder:', err.message);
      // Graceful fallback: add a placeholder image with the prompt as caption
      const fallbackUrl = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
      const newImage: MoodBoardImage = {
        id: uid(),
        url: fallbackUrl,
        caption: prompt.trim(),
        isAiGenerated: false,
        prompt: prompt.trim(),
        sortOrder: images.length,
      };
      onImagesChange([...images, newImage]);
      setPrompt('');
      setShowPrompt(false);
      toast({
        title: 'Placeholder Added',
        description: 'AI generation is currently unavailable. A placeholder image was added — you can replace it with an upload.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const removeImage = (imageId: string) => {
    onImagesChange(images.filter(img => img.id !== imageId));
  };

  const updateCaption = (imageId: string, caption: string) => {
    onImagesChange(images.map(img => img.id === imageId ? { ...img, caption } : img));
  };

  const handleSaveAsTemplate = () => {
    if (!templateName.trim() || images.length === 0) return;
    setIsSavingTemplate(true);
    try {
      const tpl = saveTemplate({
        name: templateName.trim(),
        description: templateDesc.trim() || `Template from ${momentName}`,
        category: templateCategory,
        images: images.map((img, i) => ({ ...img, sortOrder: i })),
        colorPalette: ['#C9A24A', '#0B1426', '#FFFFFF', '#E8E4DD', '#2C3E50'],
        thumbnailUrl: images[0]?.url || '',
      });
      toast({ title: 'Template Saved', description: `"${tpl.name}" saved to your template library.` });
      setShowSaveTemplate(false);
      setTemplateName('');
      setTemplateDesc('');
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Compact preview mode (for moment cards)
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {images.slice(0, 4).map(img => (
          <div key={img.id} className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
            <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
          </div>
        ))}
        {images.length > 4 && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-medium" style={{ backgroundColor: 'rgba(201,162,74,0.06)', color: GOLD }}>
            +{images.length - 4}
          </div>
        )}
        {images.length === 0 && (
          <span className="text-[10px] text-gray-300 italic">No images yet</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
          <Image className="w-3 h-3 inline mr-1" /> Mood Board
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Browse Templates */}
          {onBrowseTemplates && (
            <button
              onClick={onBrowseTemplates}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border"
              style={{ borderColor: 'rgba(139,92,246,0.25)', color: '#8B5CF6' }}
            >
              <BookOpen className="w-3 h-3" /> Templates
            </button>
          )}
          {/* Save as Template */}
          {images.length > 0 && (
            <button
              onClick={() => { setShowSaveTemplate(!showSaveTemplate); setTemplateName(momentName || ''); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border"
              style={{
                borderColor: showSaveTemplate ? '#22C55E' : 'rgba(34,197,94,0.25)',
                color: showSaveTemplate ? '#FFF' : '#22C55E',
                backgroundColor: showSaveTemplate ? '#22C55E' : 'transparent',
              }}
            >
              <Save className="w-3 h-3" /> Save Template
            </button>
          )}
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border"
            style={{
              borderColor: showPrompt ? GOLD : 'rgba(201,162,74,0.2)',
              color: showPrompt ? '#FFF' : GOLD,
              backgroundColor: showPrompt ? GOLD : 'transparent',
            }}
          >
            <Wand2 className="w-3 h-3" /> AI Generate
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border"
            style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}
          >
            <Upload className="w-3 h-3" /> Upload
          </button>
        </div>
      </div>

      {/* Save as Template Form */}
      {showSaveTemplate && (
        <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(34,197,94,0.2)', backgroundColor: 'rgba(34,197,94,0.02)' }}>
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600">Save as Template</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Template Name *</label>
              <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)}
                placeholder="e.g. Elegant Wedding"
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Category</label>
              <select value={templateCategory} onChange={e => setTemplateCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none appearance-none bg-white"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}>
                <option value="Custom">Custom</option>
                <option value="Wedding">Wedding</option>
                <option value="Corporate">Corporate</option>
                <option value="Social">Social</option>
                <option value="Destination">Destination</option>
                <option value="Modern">Modern</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Description</label>
              <input type="text" value={templateDesc} onChange={e => setTemplateDesc(e.target.value)}
                placeholder="Brief description..."
                className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-gray-400">
              Saves {images.length} image{images.length !== 1 ? 's' : ''} and layout as a reusable template
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowSaveTemplate(false)}
                className="px-3 py-1.5 rounded-lg text-[10px] text-gray-400 hover:text-gray-600">Cancel</button>
              <button onClick={handleSaveAsTemplate}
                disabled={!templateName.trim() || isSavingTemplate}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-medium text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: '#22C55E' }}>
                {isSavingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompt Input */}
      {showPrompt && (
        <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(201,162,74,0.15)', backgroundColor: 'rgba(201,162,74,0.02)' }}>
          <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-2">
            <Sparkles className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />
            Describe your vision
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A rectangular table with a candyfloss pink tablecloth, gold Tiffany chairs, a glass vase with magenta roses, gold candlesticks and elegant glassware..."
            className="w-full px-3 py-2.5 rounded-lg border text-xs outline-none resize-none"
            style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A', minHeight: '80px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerateImage();
              }
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[9px] text-gray-400">Press Enter to generate. If AI is unavailable, a placeholder will be added.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowPrompt(false); setPrompt(''); }}
                className="px-3 py-1.5 rounded-lg text-[10px] text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-medium transition-all disabled:opacity-40"
                style={{ backgroundColor: GOLD, color: '#FFF' }}
              >
                {isGenerating ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-3 h-3" /> Generate Image</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone + Image Grid */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="min-h-[120px] rounded-xl border-2 border-dashed transition-colors p-3"
        style={{ borderColor: images.length > 0 ? 'rgba(201,162,74,0.1)' : 'rgba(201,162,74,0.2)' }}
      >
        {images.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-8 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
              <Image className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <p className="text-xs text-gray-400 mb-1">Drop images here or click to upload</p>
            <p className="text-[10px] text-gray-300">Or use AI Generate to create inspiration images</p>
            {onBrowseTemplates && (
              <button onClick={(e) => { e.stopPropagation(); onBrowseTemplates(); }}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-medium border transition-colors hover:bg-purple-50"
                style={{ borderColor: 'rgba(139,92,246,0.25)', color: '#8B5CF6' }}>
                <BookOpen className="w-3.5 h-3.5" /> Browse Template Library
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-xl overflow-hidden border transition-all hover:shadow-md"
                style={{ borderColor: 'rgba(201,162,74,0.1)', aspectRatio: '4/3' }}
              >
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <input
                      type="text"
                      value={img.caption}
                      onChange={(e) => updateCaption(img.id, e.target.value)}
                      className="w-full px-2 py-1 rounded text-[10px] bg-black/40 text-white border-none outline-none placeholder-white/50"
                      placeholder="Add caption..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => setPreviewImage(img)}
                      className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {img.isAiGenerated && (
                    <div className="absolute top-2 left-2">
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-500/80 text-white font-medium flex items-center gap-0.5">
                        <Sparkles className="w-2 h-2" /> AI
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add More Button */}
            <div
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-opacity-40"
              style={{ borderColor: 'rgba(201,162,74,0.2)', aspectRatio: '4/3' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="w-5 h-5 mb-1" style={{ color: GOLD }} />
              <span className="text-[10px]" style={{ color: GOLD }}>Add Image</span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage.url}
              alt={previewImage.caption}
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
            {previewImage.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
                <p className="text-white text-sm">{previewImage.caption}</p>
                {previewImage.isAiGenerated && previewImage.prompt && (
                  <p className="text-white/60 text-[10px] mt-1 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> AI Prompt: {previewImage.prompt}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MomentMoodBoard;
