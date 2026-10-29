import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Star, X, Loader2 } from 'lucide-react';
import {
  uploadPortfolioImages, appendPortfolioUrls, removePortfolioUrl,
  loadPortfolioUrls, setCoverImage, loadCoverImage,
} from '@/lib/portfolioUpload';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const GOLD = '#C9A24A';

const SupplierPhotosPanel: React.FC = () => {
  const { user } = useAppContext();
  const [urls, setUrls] = useState<string[]>([]);
  const [coverUrl, setCoverUrlState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmRemoveUrl, setConfirmRemoveUrl] = useState<string | null>(null);

  const load = async () => {
    if (!user?.id) return;
    const [portfolioUrls, cover] = await Promise.all([loadPortfolioUrls(user.id), loadCoverImage(user.id)]);
    setUrls(portfolioUrls);
    setCoverUrlState(cover);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user?.id) return;
    setUploading(true);
    try {
      const results = await uploadPortfolioImages(Array.from(files), user.id, (p) => {
        setProgressText(`Uploading ${p.current} of ${p.total}...`);
      });
      const successfulUrls = results.filter(r => r.url && !r.error).map(r => r.url);
      const failedCount = results.filter(r => r.error).length;

      if (successfulUrls.length > 0) {
        const { success, allUrls } = await appendPortfolioUrls(user.id, successfulUrls);
        if (success) {
          setUrls(allUrls);
          toast({ title: 'Photos uploaded', description: `${successfulUrls.length} photo${successfulUrls.length > 1 ? 's' : ''} added.` });
        }
      }
      if (failedCount > 0) {
        toast({ title: 'Some uploads failed', description: `${failedCount} photo${failedCount > 1 ? 's' : ''} could not be uploaded.`, variant: 'destructive' });
      }
    } finally {
      setUploading(false);
      setProgressText(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetCover = async (url: string) => {
    if (!user?.id) return;
    const { success } = await setCoverImage(user.id, url);
    if (success) { setCoverUrlState(url); toast({ title: 'Cover photo updated' }); }
  };

  const handleRemove = (url: string) => setConfirmRemoveUrl(url);

  const performRemove = async () => {
    const url = confirmRemoveUrl;
    setConfirmRemoveUrl(null);
    if (!user?.id || !url) return;
    const { success, remainingUrls } = await removePortfolioUrl(user.id, url);
    if (success) {
      setUrls(remainingUrls);
      if (coverUrl === url) { await setCoverImage(user.id, null); setCoverUrlState(null); }
      toast({ title: 'Photo removed' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} /></div>;
  }

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          <ImageIcon className="w-3.5 h-3.5 inline mr-1.5" /> Photos
        </h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-[10px] font-medium px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm disabled:opacity-50"
          style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? (progressText || 'Uploading...') : 'Upload Photos'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {urls.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">No photos yet. Add a few examples of your work - coordinators see your cover photo first.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {urls.map(url => (
            <div key={url} className="relative group rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <img src={url} alt="Portfolio" className="w-full h-28 object-cover" />
              {coverUrl === url && (
                <span className="absolute top-1.5 left-1.5 flex items-center gap-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: GOLD }}>
                  <Star className="w-2 h-2 fill-current" /> Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {coverUrl !== url && (
                  <button onClick={() => handleSetCover(url)} title="Set as cover" className="p-1.5 rounded-full bg-white/90 hover:bg-white">
                    <Star className="w-3 h-3" style={{ color: GOLD }} />
                  </button>
                )}
                <button onClick={() => handleRemove(url)} title="Remove" className="p-1.5 rounded-full bg-white/90 hover:bg-white">
                  <X className="w-3 h-3 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmRemoveUrl} onOpenChange={(open) => { if (!open) setConfirmRemoveUrl(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performRemove} className="bg-red-500 hover:bg-red-600">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupplierPhotosPanel;
