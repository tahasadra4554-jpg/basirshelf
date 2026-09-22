"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Edit2, FileText, Image as ImageIcon, Music, Play, Plus, Save, Search, Trash2, Video, X } from "lucide-react";
import { toast } from "sonner";

import type { SectionFile, SectionFileType } from "@/lib/types";
import { createSectionFileAction, deleteSectionFileAction, updateSectionFileAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const TYPE_CONFIG: Record<SectionFileType, { label: string; icon: any; color: string; bg: string; border: string }> = {
  video: { label: "Videos", icon: Video, color: "#DC2626", bg: "bg-red-500/10", border: "border-red-500/30" },
  audio: { label: "Audios", icon: Music, color: "#7C3AED", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  pdf: { label: "PDFs", icon: FileText, color: "#2563EB", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  image: { label: "Images", icon: ImageIcon, color: "#059669", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

export function TeacherSectionFilesManager({
  sectionId,
  bookId,
  initialFiles,
  onChanged,
}: {
  sectionId: string;
  bookId: string;
  initialFiles: SectionFile[];
  onChanged: () => void;
}) {
  const [files, setFiles] = useState<SectionFile[]>(initialFiles);
  const [activeType, setActiveType] = useState<SectionFileType>("video");
  const [showAddForm, setShowAddForm] = useState<SectionFileType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; url: string; sort_order: number }>({
    name: "",
    url: "",
    sort_order: 0,
  });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const filteredByType = (type: SectionFileType) =>
    files
      .filter((f) => f.type === type)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  const handleDelete = (file: SectionFile) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", file.id);
      const res = await deleteSectionFileAction(fd);
      if (res.ok) {
        toast.success("File deleted");
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        onChanged();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleEditStart = (file: SectionFile) => {
    setEditingId(file.id);
    setEditForm({ name: file.name, url: file.url, sort_order: file.sort_order });
  };

  const handleEditSave = (file: SectionFile) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", file.id);
      fd.set("name", editForm.name);
      fd.set("url", editForm.url);
      fd.set("sort_order", String(editForm.sort_order));
      const res = await updateSectionFileAction(null, fd);
      if (res.ok && res.data) {
        toast.success("File updated");
        setFiles((prev) => prev.map((f) => (f.id === file.id ? res.data! : f)));
        setEditingId(null);
        onChanged();
      } else {
        toast.error(res.ok ? "Failed" : res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-amber-500/20 pb-3">
        {(Object.keys(TYPE_CONFIG) as SectionFileType[]).map((type) => {
          const cfg = TYPE_CONFIG[type];
          const count = filteredByType(type).length;
          const Icon = cfg.icon;
          const isActive = activeType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                setActiveType(type);
                setShowAddForm(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? `bg-[#0F1B2D] text-white shadow-md`
                  : `bg-card text-muted-foreground hover:bg-accent hover:text-foreground`
              }`}
              style={isActive ? { borderColor: cfg.color, background: cfg.color } : {}}
            >
              <Icon className="size-3.5" />
              {cfg.label}
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Active Type Section */}
      {(() => {
        const cfg = TYPE_CONFIG[activeType];
        const Icon = cfg.icon;
        const typeFiles = filteredByType(activeType);
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-bold" style={{ color: cfg.color }}>
                <Icon className="size-4" />
                {cfg.label} ({typeFiles.length})
              </h4>
              <Button
                size="sm"
                onClick={() => setShowAddForm(showAddForm === activeType ? null : activeType)}
                style={{ background: cfg.color }}
                className="text-white hover:brightness-110"
              >
                {showAddForm === activeType ? <X className="size-4" /> : <Plus className="size-4" />}
                Add {cfg.label.slice(0, -1)}
              </Button>
            </div>

            {/* Add Form */}
            {showAddForm === activeType && (
              <AddFileForm
                sectionId={sectionId}
                type={activeType}
                bookId={bookId}
                onAdded={(newFile) => {
                  setFiles((prev) => [...prev, newFile]);
                  setShowAddForm(null);
                  onChanged();
                }}
                onCancel={() => setShowAddForm(null)}
              />
            )}

            {/* File List */}
            {typeFiles.length === 0 ? (
              <div className={`rounded-xl border border-dashed ${cfg.border} ${cfg.bg} px-4 py-8 text-center`}>
                <Icon className="mx-auto size-8 opacity-40" style={{ color: cfg.color }} />
                <p className="mt-2 text-xs font-semibold" style={{ color: cfg.color }}>
                  No {cfg.label.toLowerCase()} yet
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Add your first file using the button above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {typeFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`group flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-amber-500/30 sm:flex-row sm:items-center sm:justify-between ${cfg.border}`}
                  >
                    {editingId === file.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <Label className="text-[11px]">Name</Label>
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                              className="mt-1 h-8 text-xs"
                              placeholder="File name"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px]">Sort order</Label>
                            <Input
                              type="number"
                              value={editForm.sort_order}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                              className="mt-1 h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-[11px]">URL</Label>
                          <Input
                            value={editForm.url}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, url: e.target.value }))}
                            className="mt-1 h-8 text-xs"
                            placeholder="https://..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEditSave(file)} disabled={pending} className="h-7 text-xs">
                            <Save className="size-3" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="num-latin grid size-6 place-items-center rounded-md bg-secondary text-[10px] font-bold text-primary">
                              {file.sort_order}
                            </span>
                            <span className="truncate text-xs font-semibold text-foreground" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block truncate text-[11px] text-muted-foreground hover:text-primary hover:underline"
                            title={file.url}
                          >
                            {file.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-1 self-end sm:self-center">
                          <Button size="icon-sm" variant="ghost" onClick={() => handleEditStart(file)} aria-label="Edit">
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(file)}
                            disabled={pending}
                            aria-label="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function AddFileForm({
  sectionId,
  type,
  bookId,
  onAdded,
  onCancel,
}: {
  sectionId: string;
  type: SectionFileType;
  bookId: string;
  onAdded: (file: SectionFile) => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(createSectionFileAction, null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    if (!state) return;
    if (state.ok && state.data) {
      toast.success(state.message ?? "File added");
      onAdded(state.data);
      setName("");
      setUrl("");
      setSortOrder(0);
    } else if (!state.ok) {
      toast.error(state.error);
    }
  }, [state, onAdded]);

  const cfg = TYPE_CONFIG[type];

  return (
    <form action={formAction} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-3`}>
      <input type="hidden" name="section_id" value={sectionId} />
      <input type="hidden" name="type" value={type} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`add-name-${type}`} className="text-xs">Name</Label>
          <Input
            id={`add-name-${type}`}
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`${cfg.label.slice(0, -1)} name e.g. Grammar Lesson 1`}
            required
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`add-sort-${type}`} className="text-xs">Sort order</Label>
          <Input
            id={`add-sort-${type}`}
            name="sort_order"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="h-9 text-xs"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`add-url-${type}`} className="text-xs">URL</Label>
        <Input
          id={`add-url-${type}`}
          name="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          required
          className="h-9 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending} style={{ background: cfg.color }} className="text-white">
          <Save className="size-4" /> {pending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
