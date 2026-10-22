// ─── Supplier Product Catalog API ───────────────────────────────────────────
// Owner-only CRUD (RLS: auth.uid() = user_id) for a supplier's own catalog.

import { supabase } from '@/lib/supabase';

export interface SupplierProduct {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  currency: string;
  quantityAvailable: number | null; // null = unlimited / made to order
  color: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductInput = Omit<SupplierProduct, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

function rowToProduct(row: any): SupplierProduct {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? '',
    category: row.category ?? '',
    unitPrice: Number(row.unit_price ?? 0),
    currency: row.currency ?? 'ZAR',
    quantityAvailable: row.quantity_available === null ? null : Number(row.quantity_available),
    color: row.color ?? '',
    imageUrl: row.image_url ?? '',
    isActive: row.is_active ?? true,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchMyProducts(): Promise<SupplierProduct[]> {
  const { data, error } = await supabase
    .from('supplier_products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) { console.error('fetchMyProducts error:', error); return []; }
  return (data || []).map(rowToProduct);
}

export async function createProduct(userId: string, input: CreateProductInput): Promise<SupplierProduct | null> {
  const { data, error } = await supabase
    .from('supplier_products')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description,
      category: input.category,
      unit_price: input.unitPrice,
      currency: input.currency,
      quantity_available: input.quantityAvailable,
      color: input.color,
      image_url: input.imageUrl,
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .select()
    .single();

  if (error) { console.error('createProduct error:', error); return null; }
  return rowToProduct(data);
}

export async function updateProduct(id: string, updates: Partial<CreateProductInput>): Promise<boolean> {
  const patch: Record<string, any> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.unitPrice !== undefined) patch.unit_price = updates.unitPrice;
  if (updates.currency !== undefined) patch.currency = updates.currency;
  if (updates.quantityAvailable !== undefined) patch.quantity_available = updates.quantityAvailable;
  if (updates.color !== undefined) patch.color = updates.color;
  if (updates.imageUrl !== undefined) patch.image_url = updates.imageUrl;
  if (updates.isActive !== undefined) patch.is_active = updates.isActive;
  if (updates.sortOrder !== undefined) patch.sort_order = updates.sortOrder;

  const { error } = await supabase.from('supplier_products').update(patch).eq('id', id);
  if (error) { console.error('updateProduct error:', error); return false; }
  return true;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase.from('supplier_products').delete().eq('id', id);
  if (error) { console.error('deleteProduct error:', error); return false; }
  return true;
}

// ─── service_providers: special-requests flag ──────────────────────────────

export async function updateSpecialRequestsSettings(
  userId: string,
  acceptsSpecialRequests: boolean,
  notes: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('service_providers')
    .update({ accepts_special_requests: acceptsSpecialRequests, special_request_notes: notes })
    .eq('user_id', userId);

  if (error) { console.error('updateSpecialRequestsSettings error:', error); return false; }
  return true;
}
