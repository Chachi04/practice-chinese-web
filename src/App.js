import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const shuffle = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
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
    <div className="progress-wrap" aria-label={`Card ${current} of ${total}`}>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">{current} / {total}</span>
    </div>
  );
}

function Flashcard({ term, flipped, onFlip }) {
  return (
    <div
      className="card-scene"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onFlip()}
      aria-label={flipped ? "Showing hanzi, click to see pinyin" : "Showing pinyin, click to reveal hanzi"}
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
          {term.pinyin && <p className="card-sub-pinyin">{term.pinyin}</p>}
          <span className="card-tap-hint">tap to flip back</span>
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data.json`)
      .then((res) => res.json())
      .then((jsonData) => setData(jsonData))
      .catch((err) => console.error("Failed loading JSON", err));
  }, []);

  const termsToShow = shuffledTerms || (selectedMission ? selectedMission.Terms : []);

  useEffect(() => {
    const handler = (e) => {
      if (!selectedMission) return;
      if (e.key === "ArrowRight" || e.key === "l") {
        setCardIndex((i) => (i + 1) % termsToShow.length);
        setFlipped(false);
      }
      if (e.key === "ArrowLeft" || e.key === "h") {
        setCardIndex((i) => (i - 1 + termsToShow.length) % termsToShow.length);
        setFlipped(false);
      }
      if (e.key === " " || e.key === "f") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedMission, termsToShow.length]);

  const handleLevelChange = (e) => {
    const level = data.find((d) => d["HSK Level"] === Number(e.target.value));
    setSelectedLevel(level);
    setSelectedMission(null);
    setCardIndex(0);
    setFlipped(false);
    setShuffledTerms(null);
    setKnown(new Set());
  };

  const handleMissionChange = (e) => {
    const mission = selectedLevel.Missions.find((m) => m.Mission === Number(e.target.value));
    setSelectedMission(mission);
    setCardIndex(0);
    setFlipped(false);
    setShuffledTerms(null);
    setKnown(new Set());
  };

  const flipCard = useCallback(() => setFlipped((f) => !f), []);

  const nextCard = useCallback(() => {
    if (!selectedMission) return;
    setCardIndex((i) => (i + 1) % termsToShow.length);
    setFlipped(false);
  }, [selectedMission, termsToShow.length]);

  const prevCard = useCallback(() => {
    if (!selectedMission) return;
    setCardIndex((i) => (i - 1 + termsToShow.length) % termsToShow.length);
    setFlipped(false);
  }, [selectedMission, termsToShow.length]);

  const shuffleDeck = () => {
    if (!selectedMission) return;
    setShuffledTerms(shuffle(selectedMission.Terms));
    setCardIndex(0);
    setFlipped(false);
    setKnown(new Set());
  };

  const markKnown = () => {
    const term = termsToShow[cardIndex];
    if (!term) return;
    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(term.hanzi)) next.delete(term.hanzi);
      else next.add(term.hanzi);
      return next;
    });
  };

  const isKnown = selectedMission && termsToShow[cardIndex]
    ? known.has(termsToShow[cardIndex].hanzi)
    : false;

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
        <ThemeToggle theme={theme} onToggle={() => setTheme((t) => t === "dark" ? "light" : "dark")} />
      </header>

      <main className="app-main">
        <section className="selector-section">
          <div className="selector-group">
            <label className="selector-label" htmlFor="level-select">HSK Level</label>
            <div className="select-wrap">
              <select
                id="level-select"
                className="selector"
                onChange={handleLevelChange}
                value={selectedLevel ? selectedLevel["HSK Level"] : ""}
              >
                <option value="" disabled>Select level…</option>
                {data.map((level) => (
                  <option key={level["HSK Level"]} value={level["HSK Level"]}>
                    HSK {level["HSK Level"]}
                  </option>
                ))}
              </select>
              <svg className="select-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6l4 4 4-4"/>
              </svg>
            </div>
          </div>

          {selectedLevel && (
            <div className="selector-group">
              <label className="selector-label" htmlFor="mission-select">Mission</label>
              <div className="select-wrap">
                <select
                  id="mission-select"
                  className="selector"
                  onChange={handleMissionChange}
                  value={selectedMission ? selectedMission.Mission : ""}
                >
                  <option value="" disabled>Select mission…</option>
                  {selectedLevel.Missions.map((m) => (
                    <option key={m.Mission} value={m.Mission}>
                      Mission {m.Mission}
                    </option>
                  ))}
                </select>
                <svg className="select-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6l4 4 4-4"/>
                </svg>
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
                <text x="32" y="56" textAnchor="middle" fontSize="14" fontFamily="serif" strokeWidth="1">字</text>
              </svg>
            </div>
            <h2>Select a level and mission</h2>
            <p>Choose your HSK level and mission above to start practicing characters.</p>
            <div className="keyboard-hint">
              <kbd>←</kbd><kbd>→</kbd> navigate   <kbd>Space</kbd> flip
            </div>
          </div>
        )}

        {selectedMission && (
          <div className="practice-area">
            <ProgressBar
              current={cardIndex + 1}
              total={termsToShow.length}
            />

            {known.size > 0 && (
              <div className="known-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                {known.size} known
              </div>
            )}

            <Flashcard
              term={termsToShow[cardIndex]}
              flipped={flipped}
              onFlip={flipCard}
            />

            <div className="card-actions">
              <button className="btn btn-ghost" onClick={prevCard} aria-label="Previous card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Prev
              </button>

              <button className={`btn btn-known${isKnown ? " is-known" : ""}`} onClick={markKnown}>
                {isKnown ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    Known
                  </>
                ) : "Mark known"}
              </button>

              <button className="btn btn-ghost" onClick={nextCard} aria-label="Next card">
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div className="secondary-actions">
              <button className="btn btn-text" onClick={flipCard}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Flip card
              </button>
              <button className="btn btn-text" onClick={shuffleDeck}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                </svg>
                Shuffle
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
