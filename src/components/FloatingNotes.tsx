"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, Plus, Pin, PinOff, Search, Trash2, StickyNote, ChevronDown } from "lucide-react";

type NoteColor = "default" | "yellow" | "green" | "blue" | "pink" | "purple" | "orange";

interface Note {
  id: string;
  title: string;
  body: string;
  color: NoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const COLOR_MAP: Record<NoteColor, { bg: string; border: string; header: string; label: string }> = {
  default: { bg: "#1E293B",   border: "#334155",  header: "#0F172A",  label: "Default"  },
  yellow:  { bg: "#3B2D00",   border: "#CA8A04",  header: "#2D2200",  label: "Yellow"   },
  green:   { bg: "#052e16",   border: "#16a34a",  header: "#021d0e",  label: "Green"    },
  blue:    { bg: "#0c1a2e",   border: "#2563EB",  header: "#071424",  label: "Blue"     },
  pink:    { bg: "#2d0e1f",   border: "#EC4899",  header: "#1e0814",  label: "Pink"     },
  purple:  { bg: "#1e0a3c",   border: "#7C3AED",  header: "#140620",  label: "Purple"   },
  orange:  { bg: "#2d1500",   border: "#EA580C",  header: "#1e0d00",  label: "Orange"   },
};

const COLOR_DOTS: Record<NoteColor, string> = {
  default: "#475569",
  yellow:  "#CA8A04",
  green:   "#16a34a",
  blue:    "#2563EB",
  pink:    "#EC4899",
  purple:  "#7C3AED",
  orange:  "#EA580C",
};

const STORAGE_KEY = "zpluscrm_floating_notes";

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

function createNote(): Note {
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    body: "",
    color: "default",
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface FloatingNotesProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FloatingNotes({ isOpen, onClose }: FloatingNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  // Persist whenever notes change
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setEditingId(null);
        setColorPickerFor(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const addNote = () => {
    const n = createNote();
    setNotes(prev => [n, ...prev]);
    setEditingId(n.id);
  };

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      )
    );
  }, []);

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const togglePin = (id: string) => {
    setNotes(prev =>
      prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)
    );
  };

  const filtered = notes
    .filter(n => {
      const q = search.toLowerCase();
      return !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 64,
        right: 16,
        width: 360,
        maxHeight: "calc(100vh - 80px)",
        background: "#0F172A",
        border: "1.5px solid #1E293B",
        borderRadius: 20,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
      ref={panelRef}
    >
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #1E293B", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#E2E8F0", fontWeight: 800, fontSize: 15 }}>
            <StickyNote size={17} style={{ color: "#FBBF24" }} />
            My Notes
            <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", background: "#1E293B", borderRadius: 20, padding: "1px 8px" }}>
              {notes.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={addNote}
              title="New Note"
              style={{ background: "#6366F1", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}
            >
              <Plus size={15} />
            </button>
            <button
              onClick={onClose}
              title="Close Notes"
              style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94A3B8" }}
            >
              <ChevronDown size={15} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            style={{
              width: "100%", height: 32, paddingLeft: 30, paddingRight: 10,
              background: "#1E293B", border: "1px solid #334155",
              borderRadius: 8, fontSize: 12, color: "#E2E8F0", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ─── Notes List ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 12px" }}>
        {notes.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569" }}>
            <StickyNote size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>No notes yet</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Click + to add your first note</div>
          </div>
        )}

        {filtered.length === 0 && notes.length > 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569", fontSize: 13 }}>
            No notes match your search
          </div>
        )}

        {/* Pinned section */}
        {pinned.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 6px 6px" }}>
              📌 PINNED
            </div>
            {pinned.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                isEditing={editingId === note.id}
                colorPickerOpen={colorPickerFor === note.id}
                onEdit={() => setEditingId(note.id)}
                onBlur={() => setEditingId(prev => prev === note.id ? null : prev)}
                onChange={patch => updateNote(note.id, patch)}
                onDelete={() => deleteNote(note.id)}
                onPin={() => togglePin(note.id)}
                onColorToggle={() => setColorPickerFor(prev => prev === note.id ? null : note.id)}
                onColorSelect={c => { updateNote(note.id, { color: c }); setColorPickerFor(null); }}
              />
            ))}
          </>
        )}

        {/* Unpinned section */}
        {unpinned.length > 0 && (
          <>
            {pinned.length > 0 && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 6px 6px" }}>
                OTHERS
              </div>
            )}
            {unpinned.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                isEditing={editingId === note.id}
                colorPickerOpen={colorPickerFor === note.id}
                onEdit={() => setEditingId(note.id)}
                onBlur={() => setEditingId(prev => prev === note.id ? null : prev)}
                onChange={patch => updateNote(note.id, patch)}
                onDelete={() => deleteNote(note.id)}
                onPin={() => togglePin(note.id)}
                onColorToggle={() => setColorPickerFor(prev => prev === note.id ? null : note.id)}
                onColorSelect={c => { updateNote(note.id, { color: c }); setColorPickerFor(null); }}
              />
            ))}
          </>
        )}
      </div>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #1E293B", padding: "8px 16px", flexShrink: 0 }}>
        <button
          onClick={addNote}
          style={{
            width: "100%", height: 34, background: "rgba(99,102,241,0.1)",
            border: "1.5px dashed rgba(99,102,241,0.35)", borderRadius: 10,
            color: "#818CF8", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.2)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.1)"; }}
        >
          <Plus size={14} /> Add New Note
        </button>
      </div>
    </div>
  );
}

// ─── Note Card Component ──────────────────────────────────────────────────────
interface NoteCardProps {
  note: Note;
  isEditing: boolean;
  colorPickerOpen: boolean;
  onEdit: () => void;
  onBlur: () => void;
  onChange: (patch: Partial<Note>) => void;
  onDelete: () => void;
  onPin: () => void;
  onColorToggle: () => void;
  onColorSelect: (color: NoteColor) => void;
}

function NoteCard({
  note, isEditing, colorPickerOpen,
  onEdit, onBlur, onChange, onDelete, onPin, onColorToggle, onColorSelect,
}: NoteCardProps) {
  const colors = COLOR_MAP[note.color];

  return (
    <div
      style={{
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 12,
        marginBottom: 8,
        overflow: "visible",
        position: "relative",
        transition: "all 0.15s",
      }}
      onClick={onEdit}
    >
      {/* Top bar with title + actions */}
      <div
        style={{
          background: colors.header,
          padding: "8px 10px 6px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderRadius: "10px 10px 0 0",
        }}
      >
        {/* Color dot */}
        <div
          style={{ width: 10, height: 10, borderRadius: "50%", background: COLOR_DOTS[note.color], flexShrink: 0, cursor: "pointer" }}
          onClick={e => { e.stopPropagation(); onColorToggle(); }}
          title="Change color"
        />

        {isEditing ? (
          <input
            autoFocus
            value={note.title}
            onChange={e => onChange({ title: e.target.value })}
            onClick={e => e.stopPropagation()}
            placeholder="Title..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 13, fontWeight: 700, color: "#E2E8F0",
              fontFamily: "'Inter', sans-serif",
            }}
          />
        ) : (
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: note.title ? "#E2E8F0" : "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {note.title || "Untitled note"}
          </div>
        )}

        {/* Actions */}
        <button onClick={e => { e.stopPropagation(); onPin(); }} title={note.pinned ? "Unpin" : "Pin"} style={{ background: "none", border: "none", cursor: "pointer", color: note.pinned ? "#FBBF24" : "#475569", padding: 0, display: "flex" }}>
          {note.pinned ? <Pin size={13} /> : <PinOff size={13} />}
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 0, display: "flex" }}>
          <Trash2 size={13} />
        </button>
      </div>

      {/* Color picker popover */}
      {colorPickerOpen && (
        <div
          style={{
            position: "absolute", top: 34, left: 10, zIndex: 300,
            background: "#0F172A", border: "1px solid #334155", borderRadius: 10,
            padding: 8, display: "flex", gap: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {(Object.entries(COLOR_DOTS) as [NoteColor, string][]).map(([key, dotColor]) => (
            <div
              key={key}
              onClick={() => onColorSelect(key)}
              title={COLOR_MAP[key].label}
              style={{
                width: 20, height: 20, borderRadius: "50%", background: dotColor, cursor: "pointer",
                border: note.color === key ? "2px solid white" : "2px solid transparent",
                transition: "transform 0.1s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; }}
            />
          ))}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: "8px 10px 10px" }}>
        {isEditing ? (
          <textarea
            value={note.body}
            onChange={e => onChange({ body: e.target.value })}
            onClick={e => e.stopPropagation()}
            placeholder="Write your note here..."
            rows={4}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              fontSize: 12.5, color: "#CBD5E1", lineHeight: 1.6, resize: "vertical",
              fontFamily: "'Inter', sans-serif", boxSizing: "border-box", minHeight: 60,
            }}
          />
        ) : (
          <div
            style={{
              fontSize: 12.5, color: note.body ? "#94A3B8" : "#334155",
              lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
              maxHeight: 80, overflow: "hidden",
            }}
          >
            {note.body || "Click to add note..."}
          </div>
        )}

        {/* Timestamp */}
        <div style={{ fontSize: 10, color: "#334155", marginTop: 6, textAlign: "right" }}>
          {new Date(note.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}
