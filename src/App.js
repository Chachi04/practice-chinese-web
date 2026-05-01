import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

const STORAGE_KEY = "chinese-practice-data";

const shuffle = (array) => {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// ── helpers to produce immutable updated data ────────────────────────────────
const updateLevel = (data, hskLevel, updater) =>
  data.map((l) => l["HSK Level"] === hskLevel ? updater(l) : l);

const updateMission = (data, hskLevel, missionNum, updater) =>
  updateLevel(data, hskLevel, (l) => ({
    ...l,
    Missions: l.Missions.map((m) => m.Mission === missionNum ? updater(m) : m),
  }));

// ── sub-components ───────────────────────────────────────────────────────────

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="progress-wrap">
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
      <span className="progress-label">{current} / {total}</span>
    </div>
  );
}

function Flashcard({ term, flipped, onFlip }) {
  return (
    <div className="card-scene" onClick={onFlip} role="button" tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onFlip()}
      aria-label={flipped ? "Showing hanzi" : "Showing pinyin, click to reveal"}
    >
      <div className={`card-inner${flipped ? " is-flipped" : ""}`}>
        <div className="card-face card-front">
          <span className="card-label">拼音</span>
          <p className="card-pinyin">{term.pinyin}</p>
          {term.english && <p className="card-hint">{term.english}</p>}
          <span className="card-tap-hint">tap to reveal</span>
        </div>
        <div className="card-face card-back">
          <span className="card-label">汉字</span>
          <p className="card-hanzi">{term.hanzi}</p>
          <p className="card-sub-pinyin">{term.pinyin}</p>
          <span className="card-tap-hint">tap to flip back</span>
        </div>
      </div>
    </div>
  );
}

// ── Card Form Modal ──────────────────────────────────────────────────────────
function CardModal({ initial, onSave, onClose }) {
  const [hanzi, setHanzi] = useState(initial?.hanzi || "");
  const [pinyin, setPinyin] = useState(initial?.pinyin || "");
  const hanziRef = useRef(null);

  useEffect(() => { hanziRef.current?.focus(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hanzi.trim() || !pinyin.trim()) return;
    onSave({ hanzi: hanzi.trim(), pinyin: pinyin.trim(), saved: false });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={initial ? "Edit card" : "Add card"}>
        <div className="modal-header">
          <h3>{initial ? "Edit card" : "Add card"}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="form-label">
            汉字 (Hanzi)
            <input ref={hanziRef} className="form-input hanzi-input" value={hanzi}
              onChange={(e) => setHanzi(e.target.value)}
              placeholder="你好" required />
          </label>
          <label className="form-label">
            拼音 (Pinyin)
            <input className="form-input" value={pinyin}
              onChange={(e) => setPinyin(e.target.value)}
              placeholder="nǐ hǎo" required />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"
              disabled={!hanzi.trim() || !pinyin.trim()}>
              {initial ? "Save changes" : "Add card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Manage View ──────────────────────────────────────────────────────────────
function ManageView({ data, onDataChange, onClose }) {
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [expandedMission, setExpandedMission] = useState(null);
  const [modal, setModal] = useState(null); // { type, hskLevel, missionNum, termIndex }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [newLevelNum, setNewLevelNum] = useState("");
  const [newMissionNum, setNewMissionNum] = useState("");

  const saveData = (next) => onDataChange(next);

  // ── Level ops
  const addLevel = () => {
    const num = parseInt(newLevelNum);
    if (!num || data.find((l) => l["HSK Level"] === num)) return;
    saveData([...data, { "HSK Level": num, Missions: [] }].sort((a, b) => a["HSK Level"] - b["HSK Level"]));
    setNewLevelNum("");
  };

  const deleteLevel = (hskLevel) => {
    saveData(data.filter((l) => l["HSK Level"] !== hskLevel));
    setDeleteConfirm(null);
    if (expandedLevel === hskLevel) setExpandedLevel(null);
  };

  // ── Mission ops
  const addMission = (hskLevel) => {
    const num = parseInt(newMissionNum);
    const level = data.find((l) => l["HSK Level"] === hskLevel);
    if (!num || level.Missions.find((m) => m.Mission === num)) return;
    saveData(updateLevel(data, hskLevel, (l) => ({
      ...l,
      Missions: [...l.Missions, { Mission: num, Terms: [] }].sort((a, b) => a.Mission - b.Mission),
    })));
    setNewMissionNum("");
  };

  const deleteMission = (hskLevel, missionNum) => {
    saveData(updateLevel(data, hskLevel, (l) => ({
      ...l,
      Missions: l.Missions.filter((m) => m.Mission !== missionNum),
    })));
    setDeleteConfirm(null);
    if (expandedMission === `${hskLevel}-${missionNum}`) setExpandedMission(null);
  };

  // ── Term ops
  const addTerm = (hskLevel, missionNum, term) => {
    saveData(updateMission(data, hskLevel, missionNum, (m) => ({
      ...m, Terms: [...m.Terms, term],
    })));
    setModal(null);
  };

  const editTerm = (hskLevel, missionNum, termIndex, term) => {
    saveData(updateMission(data, hskLevel, missionNum, (m) => ({
      ...m,
      Terms: m.Terms.map((t, i) => i === termIndex ? term : t),
    })));
    setModal(null);
  };

  const deleteTerm = (hskLevel, missionNum, termIndex) => {
    saveData(updateMission(data, hskLevel, missionNum, (m) => ({
      ...m, Terms: m.Terms.filter((_, i) => i !== termIndex),
    })));
    setDeleteConfirm(null);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.json";
    a.click();
  };

  return (
    <div className="manage-view">
      <div className="manage-header">
        <h2>Manage Cards</h2>
        <div className="manage-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={exportData}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Export JSON
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Close
          </button>
        </div>
      </div>

      <div className="manage-body">
        {data.map((level) => (
          <div key={level["HSK Level"]} className="manage-level">
            <div className="manage-level-header"
              onClick={() => setExpandedLevel(expandedLevel === level["HSK Level"] ? null : level["HSK Level"])}>
              <div className="manage-level-title">
                <svg className={`chevron${expandedLevel === level["HSK Level"] ? " open" : ""}`}
                  width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6l4 4 4-4"/>
                </svg>
                <span>HSK {level["HSK Level"]}</span>
                <span className="manage-count">{level.Missions.reduce((s, m) => s + m.Terms.length, 0)} cards</span>
              </div>
              <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: "level", hskLevel: level["HSK Level"] }); }}
                aria-label="Delete level">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>

            {expandedLevel === level["HSK Level"] && (
              <div className="manage-level-body">
                {level.Missions.map((mission) => (
                  <div key={mission.Mission} className="manage-mission">
                    <div className="manage-mission-header"
                      onClick={() => { const key = `${level["HSK Level"]}-${mission.Mission}`; setExpandedMission(expandedMission === key ? null : key); }}>
                      <div className="manage-mission-title">
                        <svg className={`chevron${expandedMission === `${level["HSK Level"]}-${mission.Mission}` ? " open" : ""}`}
                          width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 6l4 4 4-4"/>
                        </svg>
                        <span>Mission {mission.Mission}</span>
                        <span className="manage-count">{mission.Terms.length} cards</span>
                      </div>
                      <div className="manage-mission-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn" onClick={() => setModal({ type: "add", hskLevel: level["HSK Level"], missionNum: mission.Mission })}
                          aria-label="Add card">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                        </button>
                        <button className="icon-btn danger"
                          onClick={() => setDeleteConfirm({ type: "mission", hskLevel: level["HSK Level"], missionNum: mission.Mission })}
                          aria-label="Delete mission">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {expandedMission === `${level["HSK Level"]}-${mission.Mission}` && (
                      <div className="manage-terms">
                        {mission.Terms.length === 0 && (
                          <p className="manage-empty">No cards yet. Add one above.</p>
                        )}
                        {mission.Terms.map((term, idx) => (
                          <div key={idx} className="manage-term">
                            <div className="manage-term-content">
                              <span className="manage-term-hanzi">{term.hanzi}</span>
                              <span className="manage-term-pinyin">{term.pinyin}</span>
                            </div>
                            <div className="manage-term-actions">
                              <button className="icon-btn"
                                onClick={() => setModal({ type: "edit", hskLevel: level["HSK Level"], missionNum: mission.Mission, termIndex: idx, term })}
                                aria-label="Edit card">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              <button className="icon-btn danger"
                                onClick={() => setDeleteConfirm({ type: "term", hskLevel: level["HSK Level"], missionNum: mission.Mission, termIndex: idx })}
                                aria-label="Delete card">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add mission row */}
                <div className="manage-add-row">
                  <input className="form-input form-input-sm" type="number" min="1"
                    placeholder="Mission #" value={newMissionNum}
                    onChange={(e) => setNewMissionNum(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addMission(level["HSK Level"])}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => addMission(level["HSK Level"])}>
                    + Add mission
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add level row */}
        <div className="manage-add-level">
          <input className="form-input form-input-sm" type="number" min="1"
            placeholder="HSK level #" value={newLevelNum}
            onChange={(e) => setNewLevelNum(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLevel()}
          />
          <button className="btn btn-ghost btn-sm" onClick={addLevel}>+ Add HSK level</button>
        </div>
      </div>

      {/* Card add/edit modal */}
      {modal && (
        <CardModal
          initial={modal.type === "edit" ? modal.term : null}
          onSave={(term) => {
            if (modal.type === "add") addTerm(modal.hskLevel, modal.missionNum, term);
            else editTerm(modal.hskLevel, modal.missionNum, modal.termIndex, term);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal-sm" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>Confirm delete</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="modal-body-text">
              {deleteConfirm.type === "term" && "Delete this card? This cannot be undone."}
              {deleteConfirm.type === "mission" && "Delete this entire mission and all its cards?"}
              {deleteConfirm.type === "level" && "Delete this HSK level and all its missions and cards?"}
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => {
                if (deleteConfirm.type === "term") deleteTerm(deleteConfirm.hskLevel, deleteConfirm.missionNum, deleteConfirm.termIndex);
                if (deleteConfirm.type === "mission") deleteMission(deleteConfirm.hskLevel, deleteConfirm.missionNum);
                if (deleteConfirm.type === "level") deleteLevel(deleteConfirm.hskLevel);
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [data, setData] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffledTerms, setShuffledTerms] = useState(null);
  const [theme, setTheme] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [known, setKnown] = useState(new Set());
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Load: localStorage first, fall back to data.json
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setData(JSON.parse(stored)); return; } catch {}
    }
    fetch(`${process.env.PUBLIC_URL}/data.json`)
      .then((res) => res.json())
      .then((jsonData) => setData(jsonData))
      .catch((err) => console.error("Failed loading JSON", err));
  }, []);

  // Persist every change to localStorage
  const handleDataChange = useCallback((next) => {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // Keep selectedLevel/Mission in sync with updated data
    setSelectedLevel((prev) => prev ? next.find((l) => l["HSK Level"] === prev["HSK Level"]) || null : null);
    setSelectedMission((prevM) => {
      if (!prevM) return null;
      const level = next.find((l) => l.Missions.some((m) => m.Mission === prevM.Mission));
      return level ? level.Missions.find((m) => m.Mission === prevM.Mission) || null : null;
    });
    setShuffledTerms(null);
    setCardIndex(0);
    setFlipped(false);
  }, []);

  const termsToShow = shuffledTerms || (selectedMission ? selectedMission.Terms : []);

  useEffect(() => {
    if (managing) return;
    const handler = (e) => {
      if (!selectedMission) return;
      if (e.key === "ArrowRight" || e.key === "l") { setCardIndex((i) => (i + 1) % termsToShow.length); setFlipped(false); }
      if (e.key === "ArrowLeft" || e.key === "h") { setCardIndex((i) => (i - 1 + termsToShow.length) % termsToShow.length); setFlipped(false); }
      if (e.key === " " || e.key === "f") { e.preventDefault(); setFlipped((f) => !f); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [managing, selectedMission, termsToShow.length]);

  const handleLevelChange = (e) => {
    if (!data) return;
    const level = data.find((d) => d["HSK Level"] === Number(e.target.value));
    setSelectedLevel(level);
    setSelectedMission(null);
    setCardIndex(0); setFlipped(false); setShuffledTerms(null); setKnown(new Set());
  };

  const handleMissionChange = (e) => {
    const mission = selectedLevel.Missions.find((m) => m.Mission === Number(e.target.value));
    setSelectedMission(mission);
    setCardIndex(0); setFlipped(false); setShuffledTerms(null); setKnown(new Set());
  };

  const flipCard = useCallback(() => setFlipped((f) => !f), []);

  const nextCard = useCallback(() => {
    if (!selectedMission) return;
    setCardIndex((i) => (i + 1) % termsToShow.length); setFlipped(false);
  }, [selectedMission, termsToShow.length]);

  const prevCard = useCallback(() => {
    if (!selectedMission) return;
    setCardIndex((i) => (i - 1 + termsToShow.length) % termsToShow.length); setFlipped(false);
  }, [selectedMission, termsToShow.length]);

  const shuffleDeck = () => {
    if (!selectedMission) return;
    setShuffledTerms(shuffle(selectedMission.Terms));
    setCardIndex(0); setFlipped(false); setKnown(new Set());
  };

  const markKnown = () => {
    const term = termsToShow[cardIndex];
    if (!term) return;
    setKnown((prev) => { const n = new Set(prev); n.has(term.hanzi) ? n.delete(term.hanzi) : n.add(term.hanzi); return n; });
  };

  const isKnown = selectedMission && termsToShow[cardIndex] ? known.has(termsToShow[cardIndex].hanzi) : false;

  if (!data) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading cards…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <svg className="brand-logo" viewBox="0 0 40 40" fill="none" aria-label="Chinese Practice logo">
            <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.1"/>
            <text x="20" y="28" textAnchor="middle" fontSize="22" fontFamily="serif" fill="currentColor">习</text>
          </svg>
          <span className="brand-name">汉字练习</span>
          <span className="brand-sub">Chinese Practice</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setManaging(true)} aria-label="Manage cards">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Manage
          </button>
          <ThemeToggle theme={theme} onToggle={() => setTheme((t) => t === "dark" ? "light" : "dark")} />
        </div>
      </header>

      {managing ? (
        <ManageView data={data} onDataChange={handleDataChange} onClose={() => setManaging(false)} />
      ) : (
        <main className="app-main">
          <section className="selector-section">
            <div className="selector-group">
              <label className="selector-label" htmlFor="level-select">HSK Level</label>
              <div className="select-wrap">
                <select id="level-select" className="selector" onChange={handleLevelChange}
                  value={selectedLevel ? selectedLevel["HSK Level"] : ""}>
                  <option value="" disabled>Select level…</option>
                  {data.map((level) => (
                    <option key={level["HSK Level"]} value={level["HSK Level"]}>HSK {level["HSK Level"]}</option>
                  ))}
                </select>
                <svg className="select-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4"/></svg>
              </div>
            </div>
            {selectedLevel && (
              <div className="selector-group">
                <label className="selector-label" htmlFor="mission-select">Mission</label>
                <div className="select-wrap">
                  <select id="mission-select" className="selector" onChange={handleMissionChange}
                    value={selectedMission ? selectedMission.Mission : ""}>
                    <option value="" disabled>Select mission…</option>
                    {selectedLevel.Missions.map((m) => (
                      <option key={m.Mission} value={m.Mission}>Mission {m.Mission}</option>
                    ))}
                  </select>
                  <svg className="select-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4"/></svg>
                </div>
              </div>
            )}
          </section>

          {!selectedMission && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="8" y="12" width="48" height="40" rx="4"/>
                  <path d="M20 26h24M20 34h16"/>
                </svg>
              </div>
              <h2>Select a level and mission</h2>
              <p>Choose your HSK level and mission above to start practicing.</p>
              <div className="keyboard-hint">
                <kbd>←</kbd><kbd>→</kbd> navigate   <kbd>Space</kbd> flip
              </div>
            </div>
          )}

          {selectedMission && (
            <div className="practice-area">
              <ProgressBar current={cardIndex + 1} total={termsToShow.length} />
              {known.size > 0 && (
                <div className="known-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  {known.size} known
                </div>
              )}
              <Flashcard term={termsToShow[cardIndex]} flipped={flipped} onFlip={flipCard} />
              <div className="card-actions">
                <button className="btn btn-ghost" onClick={prevCard} aria-label="Previous">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  Prev
                </button>
                <button className={`btn btn-known${isKnown ? " is-known" : ""}`} onClick={markKnown}>
                  {isKnown ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Known</> : "Mark known"}
                </button>
                <button className="btn btn-ghost" onClick={nextCard} aria-label="Next">
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
              <div className="secondary-actions">
                <button className="btn btn-text" onClick={flipCard}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                  Flip
                </button>
                <button className="btn btn-text" onClick={shuffleDeck}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
                  Shuffle
                </button>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
