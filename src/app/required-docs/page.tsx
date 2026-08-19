"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { RequiredDoc, SubService } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, CheckCircle, Circle, Eye, Share2, MessageCircle, Layers, Folder, FileText, Upload, Download } from "lucide-react";
import { getWhatsAppLink, ensureUUID } from "@/lib/utils";
import { toast } from "sonner";

const empty = (): RequiredDoc => ({ id: "", subServiceId: "", name: "", isMandatory: true });

export default function RequiredDocsPage() {
  const { services, subServices, requiredDocs, addRequiredDoc, updateRequiredDoc, deleteRequiredDoc } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterSS, setFilterSS] = useState("all");
  const [modal, setModal] = useState<{ open: boolean; editing: RequiredDoc | null }>({ open: false, editing: null });
  const [viewSubServiceModal, setViewSubServiceModal] = useState<SubService | null>(null);
  const [previewDoc, setPreviewDoc] = useState<RequiredDoc | null>(null);
  const [form, setForm] = useState<RequiredDoc>(empty());

  const getSSInfo = (ssId: string) => {
    const ss = subServices.find(s => s.id === ssId || (ssId && ensureUUID(s.id) === ensureUUID(ssId)));
    const svc = services.find(s => s.id === ss?.serviceId || (ss?.serviceId && ensureUUID(s.id) === ensureUUID(ss.serviceId)));
    return { ss, svc };
  };

  const filtered = useMemo(() =>
    requiredDocs.filter(d => {
      const { ss, svc } = getSSInfo(d.subServiceId);
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        d.name.toLowerCase().includes(q) ||
        (ss?.name || "").toLowerCase().includes(q) ||
        (svc?.name || "").toLowerCase().includes(q) ||
        (d.fileName || "").toLowerCase().includes(q);
      const matchesSS = filterSS === "all" || d.subServiceId === filterSS || (filterSS && ensureUUID(d.subServiceId) === ensureUUID(filterSS));
      return matchesSearch && matchesSS;
    }), [requiredDocs, search, filterSS, subServices, services]);

  const openAdd = () => { setForm(empty()); setModal({ open: true, editing: null }); };
  const openEdit = (d: RequiredDoc) => { setForm({ ...d }); setModal({ open: true, editing: d }); };

  const handleSave = () => {
    if (!form.name || !form.subServiceId) { toast.error("Sub-service and document name are required"); return; }
    if (modal.editing) { updateRequiredDoc(form); toast.success("Document updated"); }
    else { addRequiredDoc({ ...form, id: `d${Date.now()}` }); toast.success("Document added"); }
    setModal({ open: false, editing: null });
  };

  // Build Main Service -> Sub-Service -> Documents Hierarchy Tree (Filtered by search)
  const hierarchyTree = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.map(svc => {
      const subs = subServices.filter(ss =>
        ss.serviceId === svc.id ||
        (svc.id && ensureUUID(ss.serviceId) === ensureUUID(svc.id)) ||
        (ss.serviceIds && (ss.serviceIds.includes(svc.id) || (svc.id && ss.serviceIds.some(id => ensureUUID(id) === ensureUUID(svc.id)))))
      );
      const filteredSubs = subs.map(ss => {
        const docs = requiredDocs.filter(d =>
          (d.subServiceId === ss.id || (ss.id && ensureUUID(d.subServiceId) === ensureUUID(ss.id))) && (
          !q ||
          d.name.toLowerCase().includes(q) ||
          ss.name.toLowerCase().includes(q) ||
          svc.name.toLowerCase().includes(q) ||
          (d.fileName || "").toLowerCase().includes(q)
        ));
        return { subService: ss, docs };
      }).filter(item => !q || item.docs.length > 0 || item.subService.name.toLowerCase().includes(q) || svc.name.toLowerCase().includes(q));

      return {
        service: svc,
        subServices: filteredSubs
      };
    }).filter(item => !q || item.subServices.length > 0 || item.service.name.toLowerCase().includes(q));
  }, [services, subServices, requiredDocs, search]);

  return (
    <AppShell title="Required Documents Checklist" subtitle="Nested hierarchy: Main Service → Sub-Service → Required Documents with WhatsApp Share">
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search required documents..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="fy-selector" value={filterSS} onChange={e => setFilterSS(e.target.value)}>
              <option value="all">All Sub Services</option>
              {subServices.map(ss => <option key={ss.id} value={ss.id}>{ss.name}</option>)}
            </select>
          </div>
          <button className="btn-slds btn-slds-primary" onClick={openAdd}><Plus size={15} /> Add Required Doc</button>
        </div>

        {/* Section 4: Main Service -> Sub-Service -> Documents Nested Hierarchy View */}
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 14, textTransform: "uppercase" }}>
            Service Compliance Document Requirements (Main Service → Sub-Service → Documents)
          </div>

          <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
            {hierarchyTree.map(({ service, subServices }) => (
              <div key={service.id} className="section-card" style={{ padding: 18, border: "1px solid #CBD5E1", borderRadius: 12, background: "white" }}>
                {/* 1. Main Service Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid #F1F5F9" }}>
                  <Folder size={18} color="#0176D3" />
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{service.name}</span>
                  <span className="badge-slds badge-new" style={{ fontSize: 11 }}>{subServices.length} Sub-Services</span>
                </div>

                {/* 2. Sub-Services under Main Service */}
                <div style={{ marginTop: 12, display: "grid", gap: 10, paddingLeft: 12 }}>
                  {subServices.map(({ subService, docs }) => (
                    <div key={subService.id} style={{ background: "#F8FAFC", padding: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Layers size={15} color="#059669" />
                          <span style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{subService.name}</span>
                          <span className="chip" style={{ background: "#E0F2FE", color: "#0369A1", fontSize: 11 }}>
                            {docs.length} Docs Required
                          </span>
                        </div>
                        {/* View option under sub-service to inspect required documents */}
                        <button
                          className="btn-slds btn-slds-secondary"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => setViewSubServiceModal(subService)}
                        >
                          <Eye size={13} />
                          <span>View Required Docs</span>
                        </button>
                      </div>

                      {/* 3. Documents List preview with direct PDF Attachment badge & WhatsApp Share */}
                      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {docs.map(doc => (
                          <div key={doc.id} style={{ background: "white", border: "1px solid #CBD5E1", padding: "6px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{doc.name}</span>
                            {doc.isMandatory && <span style={{ color: "#DC2626", fontWeight: 700, fontSize: 11 }}>* Mandatory</span>}
                            {doc.fileName && (
                              <a
                                href={doc.fileUrl || "#"}
                                download={doc.fileName}
                                className="chip"
                                style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", fontSize: 10, padding: "2px 6px" }}
                                title={`Download PDF Template: ${doc.fileName}`}
                              >
                                <FileText size={10} style={{ marginRight: 3 }} />
                                PDF Attached
                              </a>
                            )}
                            {/* WhatsApp Share Button for Document */}
                            <a
                              href={getWhatsAppLink("9876543210", `📋 Required Document Notice\nMain Service: ${service.name}\nSub-Service: ${subService.name}\nDocument Required: ${doc.name} (${doc.isMandatory ? "Mandatory" : "Optional"})${doc.fileName ? `\nAttached Template: ${doc.fileName}` : ""}\nPlease upload/send this file.`)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-slds btn-slds-success"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              title="Share Document Requirement via WhatsApp"
                            >
                              <MessageCircle size={11} />
                              <span>Share</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Documents Table View */}
          <div className="table-scroll-container">
            <table>
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th>Main Service</th>
                  <th>Sub Service</th>
                  <th>Document Name</th>
                  <th>Attached File</th>
                  <th>Mandatory</th>
                  <th>WhatsApp Share</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const { ss, svc } = getSSInfo(d.subServiceId);
                  return (
                    <tr key={d.id}>
                      <td className="col-num">{i + 1}</td>
                      <td><span className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{svc?.name || "-"}</span></td>
                      <td><span className="chip" style={{ background: "#F0FDF4", color: "#15803D" }}>{ss?.name || "-"}</span></td>
                      <td style={{ fontWeight: 700, color: "#0F172A" }}>{d.name}</td>
                      <td>
                        {d.fileName ? (
                          <a
                            href={d.fileUrl || "#"}
                            download={d.fileName}
                            className="chip"
                            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", fontSize: 11, cursor: "pointer" }}
                          >
                            <FileText size={12} style={{ marginRight: 4 }} />
                            {d.fileName}
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94A3B8" }}>No file attached</span>
                        )}
                      </td>
                      <td>
                        {d.isMandatory
                          ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#DC2626", fontWeight: 600, fontSize: 12 }}><CheckCircle size={14} /> Mandatory</span>
                          : <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#94A3B8", fontSize: 12 }}><Circle size={14} /> Optional</span>
                        }
                      </td>
                      <td>
                        <a
                          href={getWhatsAppLink("9876543210", `📋 Document Requirement: ${d.name} for ${ss?.name} (${svc?.name}). Please provide this document.`)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-slds btn-slds-success"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                        >
                          <Share2 size={12} />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                      <td className="col-actions">
                        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                          <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px" }} onClick={() => openEdit(d)} title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn-slds btn-slds-secondary"
                            style={{ padding: "5px 8px", color: "#DC2626", borderColor: "#FCA5A5" }}
                            onClick={async () => {
                              try {
                                await deleteRequiredDoc(d.id);
                                toast.success(`Deleted document "${d.name}"`);
                              } catch (err) {
                                console.error(err);
                                toast.error("Failed to delete entry from database. Please try again.");
                              }
                            }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sub-Service Required Documents View Modal (Section 4 Requirement) */}
      {viewSubServiceModal && (
        <div className="command-palette-backdrop" onClick={() => setViewSubServiceModal(null)}>
          <div className="command-palette-card" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", background: "#0F172A", color: "white", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{viewSubServiceModal.name}</div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>Required Compliance Documents</div>
              </div>
              <button className="btn-slds btn-slds-secondary" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none" }} onClick={() => setViewSubServiceModal(null)}>
                ✕
              </button>
            </div>

            <div style={{ padding: 24, maxHeight: 420, overflowY: "auto" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12 }}>
                Required Documents Checklist & Sample Downloads:
              </div>
              {requiredDocs.filter(d => d.subServiceId === viewSubServiceModal.id || (viewSubServiceModal.id && ensureUUID(d.subServiceId) === ensureUUID(viewSubServiceModal.id))).length > 0 ? (
                requiredDocs.filter(d => d.subServiceId === viewSubServiceModal.id || (viewSubServiceModal.id && ensureUUID(d.subServiceId) === ensureUUID(viewSubServiceModal.id))).map(doc => {
                  const samplePdfData = doc.fileUrl || `data:application/pdf;base64,JVBERi0xLjQKJSDl4uXn...`;
                  const fileName = doc.fileName || `${doc.name.replace(/\s+/g, "_")}_Sample.pdf`;

                  return (
                    <div key={doc.id} style={{ padding: 14, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{doc.name}</span>
                          {doc.fileName && (
                            <span className="chip" style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 10, padding: "2px 6px" }}>
                              PDF Attached
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: doc.isMandatory ? "#DC2626" : "#64748B", marginTop: 2, fontWeight: 600 }}>
                          {doc.isMandatory ? "• Mandatory File Required" : "• Optional Document"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                        {/* 1. Watch / Preview PDF Option */}
                        <button
                          className="btn-slds btn-slds-primary"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => setPreviewDoc(doc)}
                          title="Watch / Preview PDF Document"
                        >
                          <Eye size={13} />
                          <span>Watch</span>
                        </button>

                        {/* 2. Download PDF Option */}
                        <a
                          href={samplePdfData}
                          download={fileName}
                          className="btn-slds btn-slds-secondary"
                          style={{ padding: "4px 10px", fontSize: 11, color: "#0176D3", fontWeight: 700 }}
                          title="Download PDF Document"
                          onClick={() => toast.success(`Downloading ${fileName}`)}
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </a>

                        {/* 3. WhatsApp Share Option */}
                        <a
                          href={getWhatsAppLink("9876543210", `📋 Document Requirement: ${doc.name} for ${viewSubServiceModal.name}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-slds btn-slds-success"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          title="Share via WhatsApp"
                        >
                          <MessageCircle size={13} />
                          <span>Share</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: 20, textAlign: "center", color: "#94A3B8" }}>
                  No required documents registered for this sub-service.
                </div>
              )}
            </div>

            <div style={{ padding: "12px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-slds btn-slds-secondary" onClick={() => setViewSubServiceModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive PDF Watch / Document Preview Modal */}
      {previewDoc && (
        <div className="command-palette-backdrop" onClick={() => setPreviewDoc(null)}>
          <div className="command-palette-card" style={{ maxWidth: 720, height: "80vh" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", background: "#0F172A", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FileText size={20} color="#38BDF8" />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>Document Viewer - {previewDoc.name}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{previewDoc.fileName || "Standard Compliance Template PDF"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={previewDoc.fileUrl || "#"}
                  download={previewDoc.fileName || `${previewDoc.name}.pdf`}
                  className="btn-slds btn-slds-primary"
                  style={{ padding: "4px 12px", fontSize: 12 }}
                  onClick={() => toast.success(`Downloading ${previewDoc.name}`)}
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </a>
                <button
                  className="btn-slds btn-slds-secondary"
                  style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none" }}
                  onClick={() => setPreviewDoc(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* In-App Document PDF Watch & Preview Screen */}
            <div style={{ flex: 1, background: "#334155", padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflowY: "auto" }}>
              {previewDoc.fileUrl ? (
                <iframe
                  src={previewDoc.fileUrl}
                  style={{ width: "100%", height: "100%", borderRadius: 8, border: "none", background: "white" }}
                  title={previewDoc.name}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "white", borderRadius: 12, padding: 32, display: "flex", flexDirection: "column", justifyContent: "between", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                  <div style={{ borderBottom: "2px solid #0F172A", paddingBottom: 16, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>CRM EXPERT COMPLIANCE DOCUMENT</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>Standard Chartered / Statutory Requirement Document</div>
                    </div>
                    <span className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 800 }}>PDF SAMPLE</span>
                  </div>

                  <div style={{ flex: 1, display: "grid", gap: 16, color: "#334155" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                      Document Title: {previewDoc.name}
                    </div>
                    <div style={{ padding: 16, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#0F172A" }}>Compliance Submission Checklist:</div>
                      <ul style={{ paddingLeft: 20, fontSize: 13, display: "grid", gap: 6 }}>
                        <li>Verify statutory entity details and PAN/GSTIN registration</li>
                        <li>Ensure document contains valid signatures or digital certification</li>
                        <li>Verify dates fall within the required Financial Year timeline</li>
                        <li>Upload original scanned PDF or clear digital copy</li>
                      </ul>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 16, marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#64748B" }}>Document Status: {previewDoc.isMandatory ? "Mandatory File" : "Optional File"}</span>
                    <button
                      className="btn-slds btn-slds-primary"
                      onClick={() => {
                        toast.success("Sample Document PDF Downloaded");
                      }}
                    >
                      <Download size={14} /> Download Sample PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Required Document Modal with PDF Upload */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Document" : "Add Required Document"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: "#0F172A" }}>Sub Service *</label>
                <select className="form-select" value={form.subServiceId} onChange={e => setForm(f => ({ ...f, subServiceId: e.target.value }))}>
                  <option value="">Select sub service</option>
                  {subServices.map(ss => {
                    const svc = services.find(s => s.id === ss.serviceId);
                    return <option key={ss.id} value={ss.id}>{svc?.name} → {ss.name}</option>;
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: "#0F172A" }}>Document Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Bank Statements"
                />
              </div>

              {/* PDF Document File Upload */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                  <FileText size={15} color="#DC2626" />
                  <span>Attach Sample PDF Document / Form Template (Optional)</span>
                </label>
                
                <div style={{ padding: 14, border: "2px dashed #CBD5E1", borderRadius: 10, background: "#F8FAFC", textAlign: "center" }}>
                  {form.fileName ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={20} color="#DC2626" />
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{form.fileName}</div>
                          <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>PDF Attachment Ready</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-slds btn-slds-secondary"
                        style={{ padding: "3px 8px", fontSize: 11, color: "#DC2626" }}
                        onClick={() => setForm(f => ({ ...f, fileName: undefined, fileUrl: undefined, fileType: undefined }))}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label style={{ cursor: "pointer", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <Upload size={24} color="#0176D3" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0176D3" }}>Click to select PDF document file</span>
                        <span style={{ fontSize: 11, color: "#64748B" }}>Supports PDF documents (.pdf, max 25MB)</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          style={{ display: "none" }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setForm(f => ({
                                  ...f,
                                  fileName: file.name,
                                  fileUrl: reader.result as string,
                                  fileType: "PDF"
                                }));
                                toast.success(`Attached ${file.name}`);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isMandatory}
                    onChange={e => setForm(f => ({ ...f, isMandatory: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: "#0176D3" }}
                  />
                  <span className="form-label" style={{ margin: 0, fontWeight: 700, color: "#0F172A", fontSize: 14 }}>
                    Mandatory Document
                  </span>
                </label>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: "14px 20px" }}>
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>{modal.editing ? "Save" : "Add"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

