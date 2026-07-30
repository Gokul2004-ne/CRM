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
    toast.success("New template created");
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
      <div style={{ display: "flex", gap: 24, minHeight: "calc(100vh - 200px)", alignItems: "stretch" }}>
        {/* Left Panel - Templates List */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <div className="data-table-wrapper" style={{ height: "100%", display: "flex", flexDirection: "column", marginBottom: 0 }}>
            <div className="data-table-header">
              <div className="data-table-title">Templates</div>
              <button className="btn-slds btn-slds-primary" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setShowNewModal(true)}>
                <Plus size={14} /> New
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
              {drafts.map(d => (
                <div key={d.id}
                  onClick={() => selectDraft(d)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: selected?.id === d.id ? "#EFF6FF" : "#FFFFFF",
                    border: selected?.id === d.id ? "1px solid #38BDF8" : "1px solid #E2E8F0",
                    borderLeft: selected?.id === d.id ? "4px solid #0176D3" : "1px solid #E2E8F0",
                    marginBottom: 8,
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{d.title}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Updated: {formatDate(d.updatedAt)}</div>
                    </div>
                    <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 6px", color: "#DC2626", borderColor: "#FCA5A5" }}
                      onClick={e => { e.stopPropagation(); deleteDraft(d.id); if (selected?.id === d.id) { setSelected(null); } toast.success("Deleted"); }} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {drafts.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#94A3B8", fontSize: 13 }}>
                  No templates yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div style={{ width: 1, background: "#E2E8F0" }} />

        {/* Right Panel - Template Editor / Empty State */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {selected ? (
            <div className="data-table-wrapper" style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: 0 }}>
              {/* Editor Header Toolbar */}
              <div className="data-table-header" style={{ gap: 16 }}>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ flex: 1, minWidth: 200, fontWeight: 700, fontSize: 16, border: "none", outline: "none", color: "#0F172A", background: "transparent" }}
                  placeholder="Document title..."
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-slds btn-slds-secondary" onClick={handlePrint}><Printer size={13} /> Print</button>
                  <button className="btn-slds btn-slds-primary" onClick={handleSave}><Save size={13} /> Save Template</button>
                </div>
              </div>

              {/* Formatting Toolbar Bar */}
              <div style={{ padding: "8px 16px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { label: "B", cmd: "bold", style: { fontWeight: "bold" } },
                  { label: "I", cmd: "italic", style: { fontStyle: "italic" } },
                  { label: "U", cmd: "underline", style: { textDecoration: "underline" } },
                  { label: "H1", cmd: "formatBlock", value: "h1" },
                  { label: "H2", cmd: "formatBlock", value: "h2" },
                  { label: "H3", cmd: "formatBlock", value: "h3" },
                  { label: "¶", cmd: "formatBlock", value: "p" },
                  { label: "• List", cmd: "insertUnorderedList" },
                  { label: "1. List", cmd: "insertOrderedList" },
                  { label: "Left", cmd: "justifyLeft" },
                  { label: "Center", cmd: "justifyCenter" },
                  { label: "Right", cmd: "justifyRight" },
                ].map(({ label, cmd, value, style }) => (
                  <button
                    key={label}
                    type="button"
                    className="btn-slds btn-slds-secondary"
                    style={{ padding: "4px 8px", fontSize: 12, ...style }}
                    onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false, value); }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Editable Body Canvas */}
              <div
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: content }}
                onInput={e => setContent((e.target as HTMLDivElement).innerHTML)}
                style={{ flex: 1, padding: 24, outline: "none", overflowY: "auto", background: "white", fontSize: 14, lineHeight: 1.6 }}
              />
            </div>
          ) : (
            <div className="data-table-wrapper" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 0 }}>
              <div style={{ textAlign: "center", padding: 48, color: "#64748B" }}>
                <FileText size={48} style={{ margin: "0 auto 16px", color: "#94A3B8" }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>No Template Selected</div>
                <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 20 }}>Select a template from the list on the left or create a new one.</p>
                <button className="btn-slds btn-slds-primary" onClick={() => setShowNewModal(true)}><Plus size={15} /> New Template</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">New Template</div><button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setShowNewModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Template Title</label><input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Engagement Letter" autoFocus /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
