import React, { useState, useCallback } from 'react';
import { 
  Upload, Image, LayoutGrid, Users, Bed, Video, Eye, Globe, 
  X, Plus, Check, Loader2, Trash2, Star, GripVertical, FileImage
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { mediaTypes, mediaCategories } from '@/data/venueTypes';

interface UploadedMedia {
  id: string;
  media_type: string;
  category: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  is_featured: boolean;
  is_cover: boolean;
  sort_order: number;
}

interface SupplierMediaUploadProps {
  supplierId: string;
  onClose?: () => void;
}

const SupplierMediaUpload: React.FC<SupplierMediaUploadProps> = ({ supplierId, onClose }) => {
  const { user } = useAppContext();
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedType, setSelectedType] = useState('image');
  const [selectedCategory, setSelectedCategory] = useState('venue');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'floorplan': return <LayoutGrid className="w-5 h-5" />;
      case 'capacity_chart': return <Users className="w-5 h-5" />;
      case 'hotel_room': return <Bed className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'virtual_tour': return <Eye className="w-5 h-5" />;
      case '360_photo': return <Globe className="w-5 h-5" />;
      default: return <FileImage className="w-5 h-5" />;
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [selectedType, selectedCategory]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (!user) {
      setError('Please sign in to upload files');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.round((i / files.length) * 100));
      
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${supplierId}/${selectedCategory}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('supplier-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('supplier-media')
          .getPublicUrl(fileName);

        // Save to database
        const { data: mediaData, error: dbError } = await supabase
          .from('supplier_media')
          .insert({
            supplier_id: supplierId,
            user_id: user.id,
            media_type: selectedType,
            category: selectedCategory,
            title: file.name.replace(/\.[^/.]+$/, ''),
            file_url: publicUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            sort_order: uploadedMedia.length + i,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setUploadedMedia(prev => [...prev, mediaData as UploadedMedia]);
      } catch (err) {
        console.error('Upload error:', err);
        setError(`Failed to upload ${file.name}`);
      }
    }
    
    setIsUploading(false);
    setUploadProgress(100);
  };

  const toggleFeatured = async (mediaId: string) => {
    const media = uploadedMedia.find(m => m.id === mediaId);
    if (!media) return;

    const { error } = await supabase
      .from('supplier_media')
      .update({ is_featured: !media.is_featured })
      .eq('id', mediaId);

    if (!error) {
      setUploadedMedia(prev => 
        prev.map(m => m.id === mediaId ? { ...m, is_featured: !m.is_featured } : m)
      );
    }
  };

  const setCoverImage = async (mediaId: string) => {
    // First, unset all cover images
    await supabase
      .from('supplier_media')
      .update({ is_cover: false })
      .eq('supplier_id', supplierId);

    // Set the new cover
    const { error } = await supabase
      .from('supplier_media')
      .update({ is_cover: true })
      .eq('id', mediaId);

    if (!error) {
      setUploadedMedia(prev => 
        prev.map(m => ({ ...m, is_cover: m.id === mediaId }))
      );
    }
  };

  const deleteMedia = async (mediaId: string) => {
    const media = uploadedMedia.find(m => m.id === mediaId);
    if (!media) return;

    // Delete from storage
    const filePath = media.file_url.split('/supplier-media/')[1];
    if (filePath) {
      await supabase.storage.from('supplier-media').remove([filePath]);
    }

    // Delete from database
    const { error } = await supabase
      .from('supplier_media')
      .delete()
      .eq('id', mediaId);

    if (!error) {
      setUploadedMedia(prev => prev.filter(m => m.id !== mediaId));
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-normal tracking-[0.04em] mb-2" style={{ color: '#FFFFFF' }}>
              Media Gallery
            </h1>
            <p className="font-body text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Upload images, floor plans, capacity charts, and more
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Media Type Selector */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <h3 className="font-display text-lg mb-4" style={{ color: '#FFFFFF' }}>Media Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {mediaTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  selectedType === type.id
                    ? 'bg-gold/20 border-gold text-gold'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:border-white/20'
                }`}
              >
                {getIconForType(type.id)}
                <span className="font-body text-xs text-center">{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Selector */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <h3 className="font-display text-lg mb-4" style={{ color: '#FFFFFF' }}>Category</h3>
          <div className="flex flex-wrap gap-2">
            {mediaCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gold text-navy'
                    : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
            dragActive
              ? 'border-gold bg-gold/10'
              : 'border-white/20 hover:border-white/40'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="text-center">
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
                <p className="font-display text-xl mb-2" style={{ color: '#FFFFFF' }}>
                  Uploading... {uploadProgress}%
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gold mx-auto mb-4" />
                <p className="font-display text-xl mb-2" style={{ color: '#FFFFFF' }}>
                  Drag & drop files here
                </p>
                <p className="font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  or click to browse
                </p>
                <p className="font-body text-sm mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Supports: JPG, PNG, WebP, MP4, PDF (Max 50MB per file)
                </p>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-xl">
            <p className="font-body text-red-400">{error}</p>
          </div>
        )}

        {/* Uploaded Media Grid */}
        {uploadedMedia.length > 0 && (
          <div className="mt-8">
            <h3 className="font-display text-xl mb-4" style={{ color: '#FFFFFF' }}>
              Uploaded Media ({uploadedMedia.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedMedia.map(media => (
                <div
                  key={media.id}
                  className="relative group bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-square relative">
                    <img
                      src={media.file_url}
                      alt={media.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleFeatured(media.id)}
                        className={`p-2 rounded-full ${
                          media.is_featured ? 'bg-gold text-navy' : 'bg-white/20 text-white'
                        }`}
                        title="Toggle Featured"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCoverImage(media.id)}
                        className={`p-2 rounded-full ${
                          media.is_cover ? 'bg-gold text-navy' : 'bg-white/20 text-white'
                        }`}
                        title="Set as Cover"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMedia(media.id)}
                        className="p-2 rounded-full bg-red-500/80 text-white"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3">
                    <p className="font-body text-sm truncate" style={{ color: '#FFFFFF' }}>
                      {media.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-white/[0.05] rounded text-xs font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {mediaTypes.find(t => t.id === media.media_type)?.name}
                      </span>
                      {media.is_cover && (
                        <span className="px-2 py-0.5 bg-gold/20 rounded text-xs font-body text-gold">
                          Cover
                        </span>
                      )}
                      {media.is_featured && (
                        <span className="px-2 py-0.5 bg-gold/20 rounded text-xs font-body text-gold">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add More Button */}
              <label className="aspect-square border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gold/50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Plus className="w-8 h-8 text-white/40 mb-2" />
                <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Add More
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 bg-gradient-to-r from-gold/10 to-transparent border border-gold/20 rounded-2xl p-6">
          <h3 className="font-display text-lg mb-4 text-gold">Tips for Great Media</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Image className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="font-body text-sm font-medium" style={{ color: '#FFFFFF' }}>High Resolution</p>
                <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Use images at least 2000px wide
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <LayoutGrid className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="font-body text-sm font-medium" style={{ color: '#FFFFFF' }}>Clear Floor Plans</p>
                <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Include dimensions and scale
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="font-body text-sm font-medium" style={{ color: '#FFFFFF' }}>Capacity Charts</p>
                <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Show different layout options
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Bed className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="font-body text-sm font-medium" style={{ color: '#FFFFFF' }}>Room Photos</p>
                <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Showcase each room type
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierMediaUpload;
