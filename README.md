# MyPicks

<p align="center">
  <strong>Hi, I'm Vishesh — I built MyPicks for those moments when you've watched everything everyone keeps recommending.</strong>
</p>

<p align="center">
  A personal discovery and recommendation system for movies, shows, anime, K-dramas, and more.
</p>

---

## Overview

MyPicks combines a personal list of shows, movies,kdramas and animes with TMDB metadata and a hybrid recommendation system to make discovering something worth watching faster.

### Features

* TMDB-powered movie & TV metadata
* Mood-based recommendations
* TF-IDF + cosine similarity
* Hybrid personalized recommendations
* Watchlist with `localStorage`
* Find Something random discovery
* Movie / series detail modal
* 120-title pagination
* Responsive dark cinematic UI

---

## Recommendation System

```text
Personal Watchlist
        ↓
TF-IDF + Cosine Similarity
        ↓
Content Similarity
        +
Mood Relevance
        +
Rating Bonus
        ↓
Hybrid Recommendation Ranking
```

Mood profiles use genre and keyword signals, while the content-based model compares title, overview, and genre information against the user's saved titles.

Mood relevance acts as an eligibility filter, while content similarity handles personalization.

---

## Tech Stack

**Frontend**

* React
* Vite
* JavaScript
* CSS

**Data / APIs**

* TMDB API
* Browser localStorage

**Recommendation**

* TF-IDF
* Cosine Similarity
* Rule-based scoring
* Hybrid recommendation ranking

**Deployment**

* GitHub
* Vercel

---

## Project Structure

```text
mypicks/
├── src/
│   ├── api/
│   │   └── tmdb.js
│   ├── components/
│   ├── data/
│   │   └── movies.js
│   ├── utils/
│   │   ├── contentRecommender.js
│   │   ├── hybridRecommender.js
│   │   └── recommendations.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── public/
├── .gitignore
├── package.json
└── README.md
```

---

## Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/mypicks.git
cd mypicks
npm install
```

Create `.env.local`:

```env
VITE_TMDB_TOKEN=your_tmdb_bearer_token
```

Then:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

---



Data & Analytics | SQL | Python | Power BI | Machine Learning

GitHub: [@visheshgaur17](https://github.com/visheshgaur17)

---

<p align="center">
  Built with React using personal movies/shows data.
</p>

<p align="center">
  Metadata and artwork provided by TMDB. MyPicks is not endorsed or certified by TMDB.
</p>
