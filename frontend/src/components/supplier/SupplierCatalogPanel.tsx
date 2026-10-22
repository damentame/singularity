import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Package, X, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  fetchMyProducts, createProduct, updateProduct, deleteProduct,
  updateSpecialRequestsSettings, SupplierProduct, CreateProductInput,
} from '@/lib/supplierProductsApi';
import { uploadPortfolioImage } from '@/lib/portfolioUpload';
import { getCurrencySymbol } from '@/data/countryConfig';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';
import SupplierPhotosPanel from './SupplierPhotosPanel';

const GOLD = '#C9A24A';

const emptyForm: CreateProductInput = {
  name: '', description: '', category: '', unitPrice: 0, currency: 'ZAR',
  quantityAvailable: null, color: '', imageUrl: '', isActive: true, sortOrder: 0,
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
      imageUrl: p.imageUrl, isActive: p.isActive, sortOrder: p.sortOrder,
    });
    setShowForm(true);
  };

  const handleImageSelect = async (file: File | null) => {
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please choose an image file.', variant: 'destructive' });
      return;
    }
    setUploadingImage(true);
    try {
      const result = await uploadPortfolioImage(file, user.id);
      if (result.url) {
        const previousUrl = form.imageUrl;
        setForm(prev => ({ ...prev, imageUrl: result.url }));
        if (previousUrl) await deleteFromSupplierMedia(previousUrl);
      } else {
        toast({ title: 'Upload failed', description: result.error || 'Please try again.', variant: 'destructive' });
      }
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (form.imageUrl) await deleteFromSupplierMedia(form.imageUrl);
    setForm(prev => ({ ...prev, imageUrl: '' }));
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

  const handleDelete = async (product: SupplierProduct) => {
    if (!confirm(`Remove "${product.name}" from your catalog?`)) return;
    const ok = await deleteProduct(product.id);
    if (ok) {
      toast({ title: 'Product removed' });
      setProducts(prev => prev.filter(p => p.id !== product.id));
      if (product.imageUrl) deleteFromSupplierMedia(product.imageUrl);
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
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl border" style={{ borderColor: 'rgba(0,0,0,0.06)', backgroundColor: '#FAFAF7' }}>
              <div className="flex items-center gap-3 min-w-0">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border" style={{ borderColor: 'rgba(0,0,0,0.06)' }} />
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
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"><Pencil className="w-3 h-3 text-gray-400" /></button>
                <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group"><Trash2 className="w-3 h-3 text-gray-300 group-hover:text-red-500" /></button>
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
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                className="relative w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border disabled:opacity-60"
                style={{ borderColor: 'rgba(201,162,74,0.25)', backgroundColor: form.imageUrl ? 'transparent' : 'rgba(201,162,74,0.05)' }}
              >
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: GOLD }} />
                ) : form.imageUrl ? (
                  <img src={form.imageUrl} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-4 h-4" style={{ color: GOLD }} />
                )}
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e.target.files?.[0] || null)} />
              <div className="flex-1 text-[10px] text-gray-400">
                {form.imageUrl ? (
                  <button type="button" onClick={handleRemoveImage} className="text-red-400 hover:text-red-500">Remove photo</button>
                ) : (
                  'Add a photo of this product (optional)'
                )}
              </div>
            </div>
            <input
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Product name *" className="w-full px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)' }}
            />
            <textarea
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)" rows={2} className="w-full px-3 py-2 text-xs border rounded-lg bg-white resize-none" style={{ borderColor: 'rgba(201,162,74,0.2)' }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="Category" className="px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)' }}
              />
              <input
                type="number" min="0" step="0.01" value={form.unitPrice || ''}
                onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                placeholder="Price" className="px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)' }}
              />
              <input
                type="number" min="0" value={form.quantityAvailable ?? ''}
                onChange={e => setForm({ ...form, quantityAvailable: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                placeholder="Qty (blank = made to order)" className="px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)' }}
              />
              <input
                value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                placeholder="Colour (if needed)" className="px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)' }}
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
            className="w-full px-3 py-2 text-xs border rounded-lg resize-none mb-3" style={{ borderColor: 'rgba(201,162,74,0.2)' }}
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
    </div>
  );
};

export default SupplierCatalogPanel;
