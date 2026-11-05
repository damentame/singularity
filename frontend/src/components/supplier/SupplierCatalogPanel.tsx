import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Package, X, Camera, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  fetchMyProducts, createProduct, updateProduct, deleteProduct,
  updateSpecialRequestsSettings, SupplierProduct, CreateProductInput,
} from '@/lib/supplierProductsApi';
import { uploadPortfolioImage } from '@/lib/portfolioUpload';
import { getCurrencySymbol, COUNTRY_FINANCE_CONFIGS } from '@/data/countryConfig';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';
import SupplierPhotosPanel from './SupplierPhotosPanel';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

// Deduped from the app's own per-country finance config, rather than a separate hardcoded list.
const CURRENCY_OPTIONS = Array.from(
  new Map(COUNTRY_FINANCE_CONFIGS.map(c => [c.currencyIso, c.currencySymbol])).entries()
);

const GOLD = '#C9A24A';

const MAX_PRODUCT_IMAGES = 4;

const emptyForm: CreateProductInput = {
  name: '', description: '', category: '', unitPrice: 0, currency: 'ZAR',
  quantityAvailable: null, color: '', imageUrls: [], isActive: true, sortOrder: 0,
};

/** Best-effort: delete a supplier-media object given its public URL. Mirrors portfolioUpload.ts's own removal logic. */
async function deleteFromSupplierMedia(url: string) {
  try {
    const marker = '/supplier-media/';
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    await supabase.storage.from('supplier-media').remove([url.substring(idx + marker.length)]);
  } catch {
    // best-effort only
  }
}

const SupplierCatalogPanel: React.FC = () => {
  const { user } = useAppContext();
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProductInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<SupplierProduct | null>(null);

  const [acceptsSpecialRequests, setAcceptsSpecialRequests] = useState(false);
  const [specialRequestNotes, setSpecialRequestNotes] = useState('');
  const [savingRequests, setSavingRequests] = useState(false);

  const load = async () => {
    setLoading(true);
    const [list, providerRow] = await Promise.all([
      fetchMyProducts(),
      user?.id
        ? supabase.from('service_providers').select('accepts_special_requests, special_request_notes').eq('user_id', user.id).maybeSingle().then(r => r.data)
        : Promise.resolve(null),
    ]);
    setProducts(list);
    if (providerRow) {
      setAcceptsSpecialRequests(providerRow.accepts_special_requests ?? false);
      setSpecialRequestNotes(providerRow.special_request_notes ?? '');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const startAdd = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const startEdit = (p: SupplierProduct) => {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description, category: p.category, unitPrice: p.unitPrice,
      currency: p.currency, quantityAvailable: p.quantityAvailable, color: p.color,
      imageUrls: p.imageUrls, isActive: p.isActive, sortOrder: p.sortOrder,
    });
    setShowForm(true);
  };

  // Images aren't carried over on duplicate - sharing the same storage files between two
  // products would mean deleting one product's photo could silently break the other's.
  const startDuplicate = (p: SupplierProduct) => {
    setEditingId(null);
    setForm({
      name: `${p.name} (Copy)`, description: p.description, category: p.category, unitPrice: p.unitPrice,
      currency: p.currency, quantityAvailable: p.quantityAvailable, color: p.color,
      imageUrls: [], isActive: p.isActive, sortOrder: products.length,
    });
    setShowForm(true);
  };

  const handleImagesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user?.id) return;
    const remaining = MAX_PRODUCT_IMAGES - form.imageUrls.length;
    if (remaining <= 0) {
      toast({ title: `Maximum ${MAX_PRODUCT_IMAGES} photos`, description: 'Remove one before adding another.', variant: 'destructive' });
      return;
    }
    const toUpload = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, remaining);
    if (toUpload.length === 0) {
      toast({ title: 'Invalid file', description: 'Please choose an image file.', variant: 'destructive' });
      return;
    }
    setUploadingImage(true);
    try {
      const results = await Promise.all(toUpload.map(f => uploadPortfolioImage(f, user.id)));
      const urls = results.filter(r => r.url && !r.error).map(r => r.url);
      if (urls.length > 0) setForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
      const failedCount = results.filter(r => r.error).length;
      if (failedCount > 0) toast({ title: 'Some uploads failed', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleRemoveImageAt = async (index: number) => {
    const url = form.imageUrls[index];
    if (url) await deleteFromSupplierMedia(url);
    setForm(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= products.length) return;
    const reordered = [...products];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setProducts(reordered);
    await Promise.all(reordered.map((p, i) => updateProduct(p.id, { sortOrder: i })));
  };

  const handleSaveProduct = async () => {
    if (!form.name.trim() || !user?.id) return;
    setSaving(true);
    try {
      const ok = editingId ? await updateProduct(editingId, form) : !!(await createProduct(user.id, form));
      if (ok) {
        toast({ title: editingId ? 'Product updated' : 'Product added' });
        setShowForm(false);
        await load();
      } else {
        toast({ title: 'Could not save product', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product: SupplierProduct) => setConfirmDeleteTarget(product);

  const performDelete = async () => {
    const product = confirmDeleteTarget;
    if (!product) return;
    setConfirmDeleteTarget(null);
    const ok = await deleteProduct(product.id);
    if (ok) {
      toast({ title: 'Product removed' });
      setProducts(prev => prev.filter(p => p.id !== product.id));
      product.imageUrls.forEach(deleteFromSupplierMedia);
    }
  };

  const handleSaveSpecialRequests = async () => {
    if (!user?.id) return;
    setSavingRequests(true);
    const ok = await updateSpecialRequestsSettings(user.id, acceptsSpecialRequests, specialRequestNotes);
    if (ok) toast({ title: 'Saved' }); else toast({ title: 'Could not save', variant: 'destructive' });
    setSavingRequests(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
            <Package className="w-3.5 h-3.5 inline mr-1.5" /> Products &amp; Pricing
          </h3>
          {!showForm && (
            <button onClick={startAdd} className="flex items-center gap-1 text-[10px] font-medium px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm" style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}>
              <Plus className="w-3 h-3" /> Add Product
            </button>
          )}
        </div>

        {products.length === 0 && !showForm && (
          <p className="text-xs text-gray-400 text-center py-8">No products yet. Add what you offer, with pricing and what you can supply.</p>
        )}

        <div className="space-y-2">
          {products.map((p, index) => (
            <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl border" style={{ borderColor: 'rgba(0,0,0,0.06)', backgroundColor: '#FAFAF7' }}>
              <div className="flex items-center gap-3 min-w-0">
                {p.imageUrls[0] ? (
                  <img src={p.imageUrls[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border" style={{ borderColor: 'rgba(0,0,0,0.06)' }} />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
                    <Package className="w-4 h-4" style={{ color: GOLD }} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{p.name}</span>
                    {p.category && <span className="text-[9px] text-gray-400">{p.category}</span>}
                    {p.color && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{p.color}</span>}
                    {!p.isActive && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">Inactive</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {getCurrencySymbol(p.currency)} {p.unitPrice.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
                    {p.quantityAvailable !== null ? ` · ${p.quantityAvailable} available` : ' · made to order'}
                  </p>
                  {p.description && <p className="text-[10px] text-gray-400 mt-0.5">{p.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={() => handleMove(index, -1)} disabled={index === 0} title="Move up" className="p-1.5 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"><ChevronUp className="w-3 h-3 text-gray-400" /></button>
                <button onClick={() => handleMove(index, 1)} disabled={index === products.length - 1} title="Move down" className="p-1.5 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"><ChevronDown className="w-3 h-3 text-gray-400" /></button>
                <button onClick={() => startDuplicate(p)} title="Duplicate" className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"><Copy className="w-3 h-3 text-gray-400" /></button>
                <button onClick={() => startEdit(p)} title="Edit" className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"><Pencil className="w-3 h-3 text-gray-400" /></button>
                <button onClick={() => handleDelete(p)} title="Remove" className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group"><Trash2 className="w-3 h-3 text-gray-300 group-hover:text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="mt-4 p-4 rounded-xl border space-y-3" style={{ borderColor: 'rgba(201,162,74,0.25)', backgroundColor: 'rgba(201,162,74,0.03)' }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: GOLD }}>{editingId ? 'Edit Product' : 'New Product'}</p>
              <button onClick={() => setShowForm(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                {form.imageUrls.map((url, i) => (
                  <div key={url} className="relative w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden border group" style={{ borderColor: 'rgba(201,162,74,0.25)' }}>
                    <img src={url} alt="Product" className="w-full h-full object-cover" />
                    <button
                      type="button" onClick={() => handleRemoveImageAt(i)}
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
                {form.imageUrls.length < MAX_PRODUCT_IMAGES && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border disabled:opacity-60"
                    style={{ borderColor: 'rgba(201,162,74,0.25)', backgroundColor: 'rgba(201,162,74,0.05)' }}
                  >
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: GOLD }} /> : <Camera className="w-4 h-4" style={{ color: GOLD }} />}
                  </button>
                )}
                <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImagesSelect(e.target.files)} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {form.imageUrls.length === 0 ? 'Add up to 4 photos of this product (optional)' : `${form.imageUrls.length} of ${MAX_PRODUCT_IMAGES} photos`}
              </p>
            </div>
            <input
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Product name *" className="w-full px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
            />
            <textarea
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)" rows={2} className="w-full px-3 py-2 text-xs border rounded-lg bg-white resize-none" style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="Category" className="px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
              />
              <div className="flex">
                <select
                  value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                  className="px-1.5 py-2 text-xs border rounded-l-lg bg-white border-r-0 flex-shrink-0" style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
                >
                  {CURRENCY_OPTIONS.map(([iso]) => <option key={iso} value={iso}>{iso}</option>)}
                </select>
                <input
                  type="number" min="0" step="0.01" value={form.unitPrice || ''}
                  onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="Price" className="w-full px-3 py-2 text-xs border rounded-r-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
                />
              </div>
              <input
                type="number" min="0" value={form.quantityAvailable ?? ''}
                onChange={e => setForm({ ...form, quantityAvailable: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                placeholder="Qty (blank = made to order)" className="px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
              />
              <input
                value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                placeholder="Colour (if needed)" className="px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-gray-400">Cancel</button>
              <button
                onClick={handleSaveProduct} disabled={saving || !form.name.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                style={{ backgroundColor: GOLD }}
              >
                {editingId ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        )}
      </div>

      <SupplierPhotosPanel />

      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: GOLD }}>Special Requests</h3>
        <label className="flex items-center gap-2 text-xs text-gray-600 mb-3">
          <input type="checkbox" checked={acceptsSpecialRequests} onChange={e => setAcceptsSpecialRequests(e.target.checked)} />
          I'm open to custom or bespoke requests outside my standard catalog
        </label>
        {acceptsSpecialRequests && (
          <textarea
            value={specialRequestNotes} onChange={e => setSpecialRequestNotes(e.target.value)} rows={2}
            placeholder="Anything coordinators should know before asking (lead time, limitations, etc.)"
            className="w-full px-3 py-2 text-xs border rounded-lg resize-none mb-3" style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
          />
        )}
        <p className="text-[9px] text-gray-300 italic mb-3">A coordinator with a special request will reach you the same way as any other quote request - through your invitation's chat.</p>
        <button
          onClick={handleSaveSpecialRequests} disabled={savingRequests}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: GOLD }}
        >
          Save
        </button>
      </div>

      <AlertDialog open={!!confirmDeleteTarget} onOpenChange={(open) => { if (!open) setConfirmDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove product?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeleteTarget && `"${confirmDeleteTarget.name}" will be removed from your catalog. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} className="bg-red-500 hover:bg-red-600">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupplierCatalogPanel;
