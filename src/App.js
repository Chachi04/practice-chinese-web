import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

const data = [
  {
    "HSK Level": 2,
    Missions: [
      {
        Mission: 1,
        Terms: [
          { hanzi: "我的爸爸会做饭。", pinyin: "wo de ba ba hui zuo fan." },
          { hanzi: "我不会游泳。", pinyin: "wo bu hui you yong." },
        ],
      },
    ],
  },
  {
    "HSK Level": 5,
    Missions: [
      {
        Mission: 1,
        Terms: [
          {
            hanzi: "我们的房费包括两个人的早餐。",
            pinyin: "wo men de fang fei bao kuo liang ge ren de zao can.",
          },
          {
            hanzi: "语言教学包括听、说、读、写四项。",
            pinyin: "yu yan jia xue bao kuo ting, shuo, du, xie si xiang.",
          },
        ],
      },
    ],
  },
];

function App() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

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
              ? selectedMission.Terms[cardIndex].hanzi
              : selectedMission.Terms[cardIndex].pinyin}
          </div>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button onClick={prevCard} style={{ marginRight: 10 }}>
              Previous
            </button>
            <button onClick={flipCard} style={{ marginRight: 10 }}>
              Flip
            </button>
            <button onClick={nextCard}>Next</button>
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
