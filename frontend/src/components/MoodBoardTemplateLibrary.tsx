import React, { useState, useRef, useMemo } from 'react';
import {
  X, Search, Download, Upload, Copy, Trash2, BookOpen, Palette,
  ChevronDown, Check, FolderOpen, Star, Image, Plus, FileJson,
  ArrowRight, Eye, Filter,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { MoodBoardImage } from '@/components/MomentMoodBoard';
import {
  MoodBoardTemplate,
  getAllTemplates,
  deleteTemplate,
  duplicateTemplate,
  exportTemplates,
  exportAllTemplates,
  importTemplates,
  applyTemplateToMoment,
} from '@/data/moodBoardTemplateStore';

const GOLD = '#C9A24A';

interface MoodBoardTemplateLibraryProps {
  onClose: () => void;
  onApplyTemplate: (images: MoodBoardImage[], templateName: string) => void;
  momentName?: string;
}

const MoodBoardTemplateLibrary: React.FC<MoodBoardTemplateLibraryProps> = ({
  onClose,
  onApplyTemplate,
  momentName,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<MoodBoardTemplate | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = useMemo(() => getAllTemplates(), [confirmDeleteId]); // re-fetch after delete

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return ['all', ...Array.from(cats).sort()];
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [templates, search, categoryFilter]);

  const builtInTemplates = filtered.filter(t => t.isBuiltIn);
  const userTemplates = filtered.filter(t => !t.isBuiltIn);

  const handleApply = (template: MoodBoardTemplate) => {
    const images = applyTemplateToMoment(template.id);
    if (images.length > 0) {
      onApplyTemplate(images, template.name);
      toast({
        title: 'Template Applied',
        description: `"${template.name}" applied${momentName ? ` to ${momentName}` : ''}. ${images.length} images added.`,
      });
      onClose();
    }
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    setConfirmDeleteId(null);
    if (previewTemplate?.id === id) setPreviewTemplate(null);
    toast({ title: 'Template Deleted', description: 'Template removed from your library.' });
  };

  const handleDuplicate = (id: string) => {
    const result = duplicateTemplate(id);
    if (result) {
      toast({ title: 'Template Duplicated', description: `"${result.name}" created.` });
    }
  };

  const handleExportAll = () => {
    const json = exportAllTemplates();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-board-templates-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Templates exported as JSON file.' });
  };

  const handleExportSingle = (id: string) => {
    const json = exportTemplates([id]);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const tpl = templates.find(t => t.id === id);
    a.download = `template-${(tpl?.name || 'export').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importTemplates(text);
      if (result.imported > 0) {
        toast({ title: 'Import Successful', description: `${result.imported} template(s) imported.` });
        setConfirmDeleteId(null); // trigger re-render
      }
      if (result.errors.length > 0) {
        toast({ title: 'Import Warnings', description: result.errors.join('; '), variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── TEMPLATE CARD ──────────────────────────────────────────────────────────
  const TemplateCard = ({ template }: { template: MoodBoardTemplate }) => {
    const isDeleting = confirmDeleteId === template.id;
    return (
      <div className="rounded-xl border overflow-hidden transition-all hover:shadow-md group"
        style={{ borderColor: 'rgba(201,162,74,0.12)', backgroundColor: '#FFF' }}>
        {/* Thumbnail Grid */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-50">
          {template.images.length > 0 ? (
            <div className="grid grid-cols-3 grid-rows-2 gap-0.5 h-full">
              {template.images.slice(0, 6).map((img, i) => (
                <div key={img.id} className={`overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                  <img src={img.url} alt={img.caption} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Image className="w-8 h-8 text-gray-200" />
            </div>
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <button onClick={() => setPreviewTemplate(template)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/90 text-gray-800 hover:bg-white transition-colors flex items-center gap-1">
                <Eye className="w-3 h-3" /> Preview
              </button>
              <button onClick={() => handleApply(template)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-colors flex items-center gap-1"
                style={{ backgroundColor: GOLD }}>
                <Check className="w-3 h-3" /> Apply
              </button>
            </div>
          </div>
          {/* Built-in badge */}
          {template.isBuiltIn && (
            <div className="absolute top-2 left-2">
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white font-semibold uppercase tracking-wider flex items-center gap-0.5">
                <Star className="w-2 h-2" /> Starter
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold truncate" style={{ color: '#1A1A1A' }}>{template.name}</h4>
              <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{template.description}</p>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wider font-medium"
              style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
              {template.category}
            </span>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1 mt-2">
            {template.colorPalette.slice(0, 5).map((color, i) => (
              <div key={i} className="w-4 h-4 rounded-full border border-gray-100" style={{ backgroundColor: color }} />
            ))}
            <span className="text-[9px] text-gray-300 ml-1">{template.images.length} images</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2 pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
            <button onClick={() => handleApply(template)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
              style={{ backgroundColor: `${GOLD}10`, color: GOLD }}>
              <ArrowRight className="w-3 h-3" /> Apply
            </button>
            <button onClick={() => handleDuplicate(template.id)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors" title="Duplicate">
              <Copy className="w-3 h-3" />
            </button>
            <button onClick={() => handleExportSingle(template.id)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors" title="Export">
              <Download className="w-3 h-3" />
            </button>
            {!template.isBuiltIn && (
              isDeleting ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDelete(template.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-[10px] font-medium">
                    Confirm
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors text-[10px]">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteId(template.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors" title="Delete">
                  <Trash2 className="w-3 h-3" />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── PREVIEW MODAL ──────────────────────────────────────────────────────────
  const PreviewModal = () => {
    if (!previewTemplate) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70" onClick={() => setPreviewTemplate(null)}>
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{previewTemplate.name}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">{previewTemplate.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { handleApply(previewTemplate); setPreviewTemplate(null); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white"
                style={{ backgroundColor: GOLD }}>
                <Check className="w-3.5 h-3.5" /> Apply to Moment
              </button>
              <button onClick={() => setPreviewTemplate(null)}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
            {/* Color Palette */}
            <div className="flex items-center gap-3 mb-5">
              <Palette className="w-3.5 h-3.5" style={{ color: GOLD }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: GOLD }}>Color Palette</span>
              <div className="flex gap-1.5 ml-2">
                {previewTemplate.colorPalette.map((color, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-lg border border-gray-100 shadow-sm" style={{ backgroundColor: color }} />
                    <span className="text-[9px] text-gray-300">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {previewTemplate.images.map(img => (
                <div key={img.id} className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={img.url} alt={img.caption} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-gray-500 line-clamp-2">{img.caption}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Meta */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-3">
                <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium"
                  style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
                  {previewTemplate.category}
                </span>
                <span className="text-[9px] text-gray-300">{previewTemplate.images.length} images</span>
                {previewTemplate.isBuiltIn && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Starter Template</span>
                )}
              </div>
              <span className="text-[9px] text-gray-300">
                {new Date(previewTemplate.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${GOLD}10` }}>
              <BookOpen className="w-4 h-4" style={{ color: GOLD }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Mood Board Template Library</h2>
              <p className="text-[10px] text-gray-400">
                {templates.length} templates available
                {momentName && <> · Applying to <span className="font-medium" style={{ color: GOLD }}>{momentName}</span></>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-colors hover:bg-gray-50"
              style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}>
              <Upload className="w-3 h-3" /> Import
            </button>
            <button onClick={handleExportAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-colors hover:bg-gray-50"
              style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}>
              <FileJson className="w-3 h-3" /> Export All
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-3 border-b flex items-center gap-3" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-xs outline-none"
              style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }} />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-gray-300" />
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors"
                style={{
                  backgroundColor: categoryFilter === cat ? GOLD : 'rgba(201,162,74,0.06)',
                  color: categoryFilter === cat ? '#FFF' : '#888',
                }}>
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">No templates found</p>
              <p className="text-[10px] text-gray-300 mt-1">Try adjusting your search or import a template</p>
            </div>
          ) : (
            <>
              {/* Starter Templates */}
              {builtInTemplates.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-600">
                      Starter Templates
                    </span>
                    <div className="flex-1 h-px bg-amber-100" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {builtInTemplates.map(t => <TemplateCard key={t.id} template={t} />)}
                  </div>
                </div>
              )}

              {/* User Templates */}
              {userTemplates.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                      My Templates
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {userTemplates.map(t => <TemplateCard key={t.id} template={t} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      {/* Preview overlay */}
      <PreviewModal />
    </div>
  );
};

export default MoodBoardTemplateLibrary;
