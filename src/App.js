import React, { useState, useEffect } from "react";

const shuffle = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

function App() {
  const [data, setData] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffledTerms, setShuffledTerms] = useState(null);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data.json`)
      .then((res) => res.json())
      .then((jsonData) => setData(jsonData))
      .catch((err) => console.error("Failed loading JSON", err));
  }, []);

  const handleLevelChange = (e) => {
    const level = data.find((d) => d["HSK Level"] === Number(e.target.value));
    setSelectedLevel(level);
    setSelectedMission(null);
    setCardIndex(0);
    setFlipped(false);
  };

  const handleMissionChange = (e) => {
    const mission = selectedLevel.Missions.find(
      (m) => m.Mission === Number(e.target.value),
    );
    setSelectedMission(mission);
    setCardIndex(0);
    setFlipped(false);
  };

  const flipCard = () => setFlipped(!flipped);

  const nextCard = () => {
    if (!selectedMission) return;
    setCardIndex((cardIndex + 1) % selectedMission.Terms.length);
    setFlipped(false);
  };

  const prevCard = () => {
    if (!selectedMission) return;
    setCardIndex(
      (cardIndex - 1 + selectedMission.Terms.length) %
        selectedMission.Terms.length,
    );
    setFlipped(false);
  };

  const shuffleDeck = () => {
    if (!selectedMission) return;
    const shuffled = shuffle(selectedMission.Terms);
    setShuffledTerms(shuffled);
    setCardIndex(0);
    setFlipped(false);
  };

  if (!data) return <div>Loading data...</div>;

  const termsToShow =
    shuffledTerms || (selectedMission ? selectedMission.Terms : []);

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Practice Chinese Flashcards</h1>

      <label>
        Select HSK Level:{" "}
        <select
          onChange={handleLevelChange}
          value={selectedLevel ? selectedLevel["HSK Level"] : ""}
        >
          <option value="" disabled>
            -- Select Level --
          </option>
          {data.map((level) => (
            <option key={level["HSK Level"]} value={level["HSK Level"]}>
              HSK Level {level["HSK Level"]}
            </option>
          ))}
        </select>
      </label>

      {selectedLevel && (
        <>
          <br />
          <br />
          <label>
            Select Mission:{" "}
            <select
              onChange={handleMissionChange}
              value={selectedMission ? selectedMission.Mission : ""}
            >
              <option value="" disabled>
                -- Select Mission --
              </option>
              {selectedLevel.Missions.map((m) => (
                <option key={m.Mission} value={m.Mission}>
                  Mission {m.Mission}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {selectedMission && (
        <>
          <br />
          <br />
          <div
            onClick={flipCard}
            style={{
              cursor: "pointer",
              border: "2px solid #333",
              borderRadius: 8,
              padding: 40,
              textAlign: "center",
              fontSize: 24,
              userSelect: "none",
              backgroundColor: flipped ? "#eef" : "#fff",
              transition: "background-color 0.3s ease",
            }}
            aria-label="Flashcard, click to flip"
          >
            {flipped
              ? termsToShow[cardIndex].hanzi
              : termsToShow[cardIndex].pinyin}
          </div>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button onClick={prevCard} style={{ marginRight: 10 }}>
              Previous
            </button>
            <button onClick={flipCard} style={{ marginRight: 10 }}>
              Flip
            </button>
            <button onClick={nextCard} style={{ marginRight: 10 }}>
              Next
            </button>
            <button onClick={shuffleDeck}>Shuffle</button>
          </div>

          <p style={{ marginTop: 10, textAlign: "center", color: "#666" }}>
            Card {cardIndex + 1} of {selectedMission.Terms.length}
          </p>
        </>
      )}
    </div>
  );
}

export default App;
