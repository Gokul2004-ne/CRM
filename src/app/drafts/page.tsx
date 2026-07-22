"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { DocumentDraft } from "@/lib/types";
import { Plus, Trash2, Save, Printer, FileText } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function DraftsPage() {
  const { drafts, addDraft, updateDraft, deleteDraft } = useAppStore();
  const [selected, setSelected] = useState<DocumentDraft | null>(drafts[0] || null);
  const [content, setContent] = useState(drafts[0]?.content || "");
  const [title, setTitle] = useState(drafts[0]?.title || "");
  const [newTitle, setNewTitle] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const selectDraft = (d: DocumentDraft) => {
    setSelected(d);
    setContent(d.content);
    setTitle(d.title);
  };

  const handleSave = () => {
    if (!selected) return;
    updateDraft({ ...selected, title, content, updatedAt: new Date().toISOString().split("T")[0] });
    toast.success("Draft saved");
  };

  const handleCreate = () => {
    if (!newTitle) { toast.error("Title required"); return; }
    const d: DocumentDraft = { id: `dr${Date.now()}`, title: newTitle, content: `<h2>${newTitle}</h2><p>Start writing here...</p>`, updatedAt: new Date().toISOString().split("T")[0] };
    addDraft(d);
    selectDraft(d);
    setShowNewModal(false);
    setNewTitle("");
    toast.success("New draft created");
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;}h1,h2,h3{color:#1A237E;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ddd;padding:8px;}</style></head><body>${content}</body></html>`);
      w.document.close();
      w.print();
    }
  };

  return (
    <AppShell title="Document Drafts" subtitle="Create and edit reusable document templates">
      <div style={{ display: "flex", gap: 16, height: "calc(100vh - 180px)" }}>
        {/* Left Panel - Draft List */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div className="data-table-wrapper" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div className="data-table-header" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <div className="data-table-title">Templates</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewModal(true)}><Plus size={13} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {drafts.map(d => (
                <div key={d.id}
                  onClick={() => selectDraft(d)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: selected?.id === d.id ? "#FFF0E8" : "transparent",
                    borderLeft: selected?.id === d.id ? "3px solid #E8520A" : "3px solid transparent",
                    marginBottom: 4,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{d.title}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{formatDate(d.updatedAt)}</div>
                    </div>
                    <button className="btn btn-danger btn-icon" style={{ padding: 4, opacity: 0.6 }}
                      onClick={e => { e.stopPropagation(); deleteDraft(d.id); if (selected?.id === d.id) { setSelected(null); } toast.success("Deleted"); }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {drafts.length === 0 && (
                <div style={{ textAlign: "center", padding: 24, color: "#94A3B8", fontSize: 13 }}>
                  No templates yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {selected ? (
            <div className="data-table-wrapper" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Editor Toolbar */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ flex: 1, minWidth: 200, fontWeight: 700, fontSize: 16, border: "none", outline: "none", color: "#0F172A", background: "transparent" }}
                  placeholder="Document title..."
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={handlePrint}><Printer size={13} /> Print</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSave}><Save size={13} /> Save</button>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="editor-toolbar">
                {[
                  { label: "B", cmd: "bold", style: "fontWeight:bold" },
                  { label: "I", cmd: "italic", style: "fontStyle:italic" },
                  { label: "U", cmd: "underline", style: "textDecoration:underline" },
                  { label: "H1", cmd: "formatBlock", value: "h1" },
                  { label: "H2", cmd: "formatBlock", value: "h2" },
                  { label: "H3", cmd: "formatBlock", value: "h3" },
                  { label: "¶", cmd: "formatBlock", value: "p" },
                  { label: "• List", cmd: "insertUnorderedList" },
                  { label: "1. List", cmd: "insertOrderedList" },
                  { label: "Left", cmd: "justifyLeft" },
                  { label: "Center", cmd: "justifyCenter" },
                  { label: "Right", cmd: "justifyRight" },
                ].map(({ label, cmd, value }) => (
                  <button key={label} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false, value); }}>{label}</button>
                ))}
              </div>

              {/* Editable Content */}
              <div
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: content }}
                onInput={e => setContent((e.target as HTMLDivElement).innerHTML)}
                className="ProseMirror"
                style={{ flex: 1, overflowY: "auto" }}
              />
            </div>
          ) : (
            <div className="data-table-wrapper" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="empty-state">
                <FileText className="empty-state-icon" size={48} />
                <div className="empty-state-text">Select a template or create a new one</div>
                <button className="btn btn-primary" onClick={() => setShowNewModal(true)}><Plus size={15} /> New Template</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">New Template</div><button className="btn btn-ghost btn-icon" onClick={() => setShowNewModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Template Title</label><input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Engagement Letter" autoFocus /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
