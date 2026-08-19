"use client";

import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { DocumentDraft } from "@/lib/types";
import { Plus, Trash2, Save, Printer, FileText, Sparkles, Bot, Wand2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const SAMPLE_AI_TEMPLATES = [
  {
    title: "GST Audit Representation Letter",
    prompt: "Write a formal GST audit representation letter to the tax officer for GSTR-9/9C verification.",
    content: `<h2>REPRESENTATION LETTER FOR GST AUDIT VERIFICATION</h2>
<p><strong>To,</strong><br/>The Assistant Commissioner of State Tax,<br/>GST Ward Division.</p>
<p><strong>Sub: Submission of Books of Accounts and Documents for GST Audit Verification for FY 2024-25.</strong></p>
<p>Respected Sir/Madam,</p>
<p>With reference to the notice issued regarding GST Audit under Section 65 of the CGST/SGST Act, 2017, we hereby submit the requested financial records, reconciliation statements (GSTR-9 & GSTR-9C), and tax liability registers for your kind review.</p>
<h3>Summary of Enclosed Documents:</h3>
<ul>
  <li>GSTR-1 & GSTR-3B monthly filing reconciliations</li>
  <li>Input Tax Credit (ITC) ledger comparison against GSTR-2B</li>
  <li>Audited Financial Statements & Profit and Loss Account</li>
</ul>
<p>We request you to kindly acknowledge the receipt of the documents. We remain available for any further clarification.</p>
<p>Yours faithfully,<br/><strong>For zpluscrm Practice & Client Representation</strong></p>`
  },
  {
    title: "Income Tax Non-Filing Explanation Notice Response",
    prompt: "Draft an official response letter to Income Tax Notice under Section 142(1) explaining delay.",
    content: `<h2>RESPONSE TO NOTICE UNDER SECTION 142(1) OF THE INCOME TAX ACT</h2>
<p><strong>To,</strong><br/>The Assessing Officer,<br/>Income Tax Department.</p>
<p><strong>Ref: PAN: ABCDE1234F | Assessment Year 2024-25</strong></p>
<p>Sir,</p>
<p>In response to the notice received under Section 142(1) of the Income Tax Act, 1961, we submit our reply on behalf of the assessee as under:</p>
<p>1. The assessee has compiled all bank account statements and Form 26AS/AIS statements.</p>
<p>2. Enclosed herewith is the Income Computation Sheet along with tax payment challan receipts.</p>
<p>We humbly request your good office to accept the enclosed submissions and finalize the assessment proceedings.</p>
<p>Thanking You,<br/>Authorized Representative</p>`
  },
  {
    title: "Client Engagement & Fee Agreement Contract",
    prompt: "Draft a legal engagement contract between CA Practice firm and corporate client for annual tax services.",
    content: `<h2>ANNUAL PRACTICE ENGAGEMENT & SERVICE AGREEMENT</h2>
<p>This Engagement Agreement is entered between <strong>zpluscrm Practice Firm</strong> ("Service Provider") and <strong>Client Entity</strong> ("Client").</p>
<h3>Scope of Practice Services:</h3>
<ol>
  <li>Monthly GST Returns Filing (GSTR-1, GSTR-3B)</li>
  <li>Quarterly TDS Statement Verification & Certificate Issuance</li>
  <li>Annual Income Tax Return (ITR) Preparation & Filing</li>
  <li>Statutory Audit & MCA Filing Compliance</li>
</ol>
<h3>Fee Terms & Payment Schedule:</h3>
<p>The annual retainer fee is payable in advance on a quarterly basis. Invoices shall be settled within 15 days of issuance.</p>`
  }
];

export default function DraftsPage() {
  const { drafts, addDraft, updateDraft, deleteDraft } = useAppStore();
  const [selected, setSelected] = useState<DocumentDraft | null>(drafts[0] || null);
  const [content, setContent] = useState(drafts[0]?.content || "");
  const [title, setTitle] = useState(drafts[0]?.title || "");
  const [newTitle, setNewTitle] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  // AI Generator Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectDraft = (d: DocumentDraft) => {
    setSelected(d);
    setContent(d.content);
    setTitle(d.title);
  };

  const handleSave = () => {
    if (!selected) return;
    updateDraft({ ...selected, title, content, updatedAt: new Date().toISOString().split("T")[0] });
    toast.success("Draft saved successfully!");
  };

  const handleCreate = () => {
    if (!newTitle.trim()) { toast.error("Title required"); return; }
    const d: DocumentDraft = {
      id: `dr_${Date.now()}`,
      title: newTitle.trim(),
      content: `<h2>${newTitle.trim()}</h2><p>Start writing document draft here...</p>`,
      updatedAt: new Date().toISOString().split("T")[0]
    };
    addDraft(d);
    selectDraft(d);
    setShowNewModal(false);
    setNewTitle("");
    toast.success("New template created!");
  };

  const handleAiGenerate = (samplePrompt?: string, sampleTitle?: string, sampleContent?: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      const generatedTitle = sampleTitle || (aiPrompt.trim() ? `AI: ${aiPrompt.slice(0, 30)}...` : "AI Generated Legal Draft");
      const generatedContent = sampleContent || `<h2>${generatedTitle}</h2>
<p><strong>Date:</strong> ${formatDate(new Date())}</p>
<p><strong>Subject:</strong> ${aiPrompt || "Legal Notice Reply & Compliance Representation"}</p>
<p>Dear Sir/Madam,</p>
<p>This draft is generated by <strong>zpluscrm AI Practice Assistant</strong> based on your prompt: <em>"${aiPrompt}"</em>.</p>
<hr/>
<p>1. We hereby submit the statutory filings and compliance declarations as required under Indian Tax Laws.</p>
<p>2. All supporting invoices, ledger vouchers, and bank statements are attached for your verification.</p>
<p>Please review and customize as needed before finalizing.</p>`;

      const newDraft: DocumentDraft = {
        id: `dr_ai_${Date.now()}`,
        title: generatedTitle,
        content: generatedContent,
        updatedAt: new Date().toISOString().split("T")[0]
      };

      addDraft(newDraft);
      selectDraft(newDraft);
      setIsGenerating(false);
      setShowAiModal(false);
      setAiPrompt("");
      toast.success("✨ AI Document Draft created!");
    }, 800);
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
    <AppShell title="Document Drafts & AI Generator" subtitle="Create, edit, and AI-generate reusable legal & compliance templates">
      <div style={{ display: "flex", gap: 24, minHeight: "calc(100vh - 200px)", alignItems: "stretch" }}>
        {/* Left Panel - Templates List */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div className="data-table-wrapper" style={{ height: "100%", display: "flex", flexDirection: "column", marginBottom: 0 }}>
            <div className="data-table-header" style={{ padding: "12px 16px" }}>
              <div className="data-table-title" style={{ fontSize: 15 }}>Templates</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn-slds btn-slds-secondary"
                  style={{ padding: "5px 10px", fontSize: 11, background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", color: "#1D4ED8", border: "1px solid #93C5FD", fontWeight: 700 }}
                  onClick={() => setShowAiModal(true)}
                  title="AI Draft Assistant"
                >
                  <Sparkles size={13} color="#2563EB" /> AI Draft
                </button>
                <button className="btn-slds btn-slds-primary" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setShowNewModal(true)}>
                  <Plus size={13} /> New
                </button>
              </div>
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
                    <button
                      className="btn-slds btn-slds-secondary"
                      style={{ padding: "4px 6px", color: "#DC2626", borderColor: "#FCA5A5" }}
                      onClick={async e => {
                        e.stopPropagation();
                        try {
                          await deleteDraft(d.id);
                          if (selected?.id === d.id) {
                            setSelected(null);
                          }
                          toast.success(`Deleted draft "${d.title}"`);
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to delete entry from database. Please try again.");
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {drafts.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#94A3B8", fontSize: 13 }}>
                  No templates yet. Click "+ New" or "AI Draft" to create one.
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
                  <button
                    className="btn-slds btn-slds-secondary"
                    style={{ background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", color: "#6D28D9", border: "1px solid #DDD6FE" }}
                    onClick={() => setShowAiModal(true)}
                  >
                    <Sparkles size={13} color="#6D28D9" /> AI Assist
                  </button>
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
                onBlur={e => setContent(e.currentTarget.innerHTML)}
                style={{ flex: 1, padding: 24, outline: "none", minHeight: 400, overflowY: "auto", fontSize: 14, lineHeight: 1.7, color: "#0F172A", background: "white" }}
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", borderRadius: 16, border: "2px dashed #CBD5E1", padding: 40, textAlign: "center" }}>
              <div>
                <FileText size={48} color="#94A3B8" style={{ margin: "0 auto 16px" }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: "#475569" }}>No Document Selected</div>
                <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4, marginBottom: 20 }}>Select a template from the left or create a new AI draft.</div>
                <button className="btn-slds btn-slds-primary" onClick={() => setShowAiModal(true)}>
                  <Sparkles size={14} /> Generate with AI Assistant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Draft Modal */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create New Template</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setShowNewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Template Title *</label>
                <input
                  className="form-input"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. GST Audit Response Notice"
                  onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleCreate}>Create Template</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Draft Assistant Modal */}
      {showAiModal && (
        <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)", color: "white", borderRadius: "16px 16px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wand2 size={18} color="white" />
                </div>
                <div>
                  <div className="modal-title" style={{ color: "white" }}>AI Document Draft Assistant</div>
                  <div style={{ fontSize: 11, color: "#C7D2FE" }}>Generate professional CA/Tax notices, agreements & representations</div>
                </div>
              </div>
              <button style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }} onClick={() => setShowAiModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: "grid", gap: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Describe the document you want AI to draft:
                </label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 90, resize: "vertical" }}
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. Draft a reply to GST notice for ITC mismatch in GSTR-3B vs 2B for ₹50,000..."
                />
              </div>

              {/* Sample Quick Prompts */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>
                  ⚡ Quick AI Templates (Click to Generate):
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {SAMPLE_AI_TEMPLATES.map(tmpl => (
                    <div
                      key={tmpl.title}
                      onClick={() => handleAiGenerate(tmpl.prompt, tmpl.title, tmpl.content)}
                      style={{
                        padding: 12,
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: 10,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#EFF6FF"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "#F8FAFC"; }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{tmpl.title}</div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{tmpl.prompt}</div>
                      </div>
                      <ArrowRight size={14} color="#0176D3" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setShowAiModal(false)}>Cancel</button>
              <button
                className="btn-slds btn-slds-primary"
                style={{ background: "linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)" }}
                disabled={isGenerating}
                onClick={() => handleAiGenerate()}
              >
                <Sparkles size={14} />
                <span>{isGenerating ? "Generating Draft..." : "Generate AI Draft"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
