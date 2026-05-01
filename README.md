# 汉字练习 · Chinese Practice

A personal HSK flashcard app for practicing Chinese character writing. Built for someone who grew up speaking Chinese but wants to strengthen their reading and writing of hanzi.

🌐 **Live:** [chachi04.github.io/practice-chinese-web](https://chachi04.github.io/practice-chinese-web)

## Features

- **HSK levels & missions** — browse vocabulary organized by HSK level and mission sets
- **3D card flip** — cards flip between pinyin (front) and hanzi (back) with a smooth CSS perspective animation
- **Mark known** — track which characters you've mastered per session with a running count
- **Shuffle** — randomize the deck order for varied practice
- **Keyboard navigation** — `←` / `→` to move between cards, `Space` or `F` to flip
- **Light & dark mode** — follows system preference, with a manual toggle
- **Responsive** — works on mobile and desktop

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 (Create React App) |
| Styling | Plain CSS with OKLCH design tokens |
| Fonts | Satoshi + Zodiak (Fontshare), Noto Serif SC (Google Fonts) |
| Data | `public/data.json` — HSK levels → missions → terms (pinyin + hanzi) |
| Deployment | GitHub Actions → `gh-pages` branch |

## Getting Started

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Format

Vocabulary lives in `public/data.json`:

```json
[
  {
    "HSK Level": 1,
    "Missions": [
      {
        "Mission": 1,
        "Terms": [
          { "pinyin": "nǐ hǎo", "hanzi": "你好" }
        ]
      }
    ]
  }
]
```

## Deployment

Pushing to `main` automatically builds and deploys via GitHub Actions (`.github/workflows/deploy.yml`). The built output is pushed to the `gh-pages` branch, which GitHub Pages serves.

To deploy manually:

```bash
npm run deploy
```

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start dev server at localhost:3000 |
| `npm run build` | Production build to `build/` |
| `npm test` | Run tests |
| `npm run deploy` | Manual deploy to GitHub Pages |
