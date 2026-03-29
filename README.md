# Bucket Golf Scorecard

Real-time multiplayer scorecard web app for Bucket Golf (the yard game with red collapsible buckets). Players create profiles, join games via room codes on their phones, enter scores hole-by-hole, and see live leaderboards.

## Features

- **Quick Play** - One tap to start scoring immediately
- **Casual Game** - Customizable games with 1-18 holes
- **Tournament Mode** - Multi-round tournaments with parallel groups and cumulative leaderboards
- **Player Profiles** - Persistent stats tracking (wins, buckets, best round, etc.)
- **Real-time Sync** - All scores update live via Firebase
- **Celebrations** - Confetti animations for buckets and wins

## Scoring System

Based on real Bucket Golf rules:
- Count your hits (swings) per hole
- If the ball goes IN the bucket, subtract 2 from the hit count
- If NOT bucketed, score equals the raw hit count
- **Formula**: `hole score = hits - 2 (if bucketed) OR hits (if not bucketed)`
- Scores can go negative: 1 hit + bucket = -1 (best possible!)
- Lowest cumulative score wins

## Setup

### 1. Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project (free tier)
2. In the project, go to **Build > Realtime Database** and click **Create Database**
3. Select a region and start in **test mode** (or use the rules below)
4. Go to **Project Settings > General** and scroll to "Your apps"
5. Click the web icon (`</>`) to register a web app
6. Copy the Firebase config values

### 2. Database Rules

In Firebase Console > Realtime Database > Rules, paste the contents of `firebase-rules.json`:

```json
{
  "rules": {
    "players": {
      "$playerId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['name', 'phone'])"
      }
    },
    "phoneIndex": {
      "$phone": {
        ".read": true,
        ".write": true
      }
    },
    "games": {
      "$gameId": {
        ".read": true,
        ".write": true
      }
    },
    "tournaments": {
      "$tournamentId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase config:

```bash
cp .env.example .env
```

Then edit `.env` with your values from step 1.

### 4. Install & Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173/bucket-golf/`

### 5. Deploy to GitHub Pages

1. Create a GitHub repo for this project
2. Update `vite.config.js` base path if your repo name differs from `bucket-golf`
3. Push to GitHub, then deploy:

```bash
npm run deploy
```

This builds the app and pushes to the `gh-pages` branch. Enable GitHub Pages in your repo settings to serve from that branch.

## Tech Stack

- React (Vite)
- Firebase Realtime Database
- React Router
- canvas-confetti
- GitHub Pages (hosting)

## Project Structure

```
src/
  contexts/     # PlayerContext (profile state management)
  components/   # Reusable UI (ScoreInput, Leaderboard, etc.)
  pages/        # Route pages (Home, Scoring, Tournament, etc.)
  utils/        # Scoring logic, room codes, stats calculation
  styles/       # Global CSS, animations
  firebase.js   # Firebase config
```
