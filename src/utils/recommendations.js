/* =========================
   MOOD PROFILES
========================= */

const moodProfiles = {
  Dark: {
    primaryGenres: [
      "Crime",
      "Horror",
    ],

    secondaryGenres: [
      "Thriller",
      "Mystery",
    ],

    keywords: [
      "dark",
      "disturbing",
      "bleak",
      "murder",
      "killer",
      "death",
      "crime",
      "psychological",
      "serial",
      "violent",
      "unsettling",
    ],
  },

  Mystery: {
    primaryGenres: [
      "Mystery",
    ],

    secondaryGenres: [
      "Thriller",
      "Crime",
    ],

    keywords: [
      "mystery",
      "investigation",
      "investigate",
      "disappearance",
      "case",
      "detective",
      "secret",
      "unknown",
      "clue",
      "missing",
      "conspiracy",
    ],
  },

  Psychological: {
    primaryGenres: [
      "Thriller",
      "Drama",
    ],

    secondaryGenres: [
      "Mystery",
      "Crime",
    ],

    keywords: [
      "psychological",
      "trauma",
      "obsession",
      "identity",
      "manipulation",
      "killer",
      "insanity",
      "memory",
      "perception",
      "delusion",
      "unreliable",
      "obsessed",
    ],
  },

  Crime: {
    primaryGenres: [
      "Crime",
    ],

    secondaryGenres: [
      "Thriller",
      "Mystery",
    ],

    keywords: [
      "crime",
      "murder",
      "detective",
      "police",
      "criminal",
      "investigation",
      "gang",
      "mafia",
      "corruption",
      "heist",
      "drug",
      "serial killer",
    ],
  },

  "Mind-Bending": {
    primaryGenres: [
      "Science Fiction",
      "Fantasy",
    ],

    secondaryGenres: [
      "Mystery",
      "Thriller",
    ],

    keywords: [
      "reality",
      "parallel",
      "memory",
      "identity",
      "twist",
      "complex",
      "timeline",
      "alternate",
      "dimension",
      "simulation",
      "perception",
      "dream",
      "nonlinear",
    ],
  },

  Horror: {
    primaryGenres: [
      "Horror",
    ],

    secondaryGenres: [
      "Thriller",
      "Mystery",
    ],

    keywords: [
      "horror",
      "ghost",
      "haunted",
      "possession",
      "demon",
      "evil",
      "curse",
      "infection",
      "unsettling",
      "supernatural",
      "monster",
      "creature",
      "terror",
      "haunting",
    ],
  },

  "Sci-Fi": {
    primaryGenres: [
      "Science Fiction",
      "Sci-Fi & Fantasy",
    ],

    secondaryGenres: [
      "Fantasy",
      "Mystery",
    ],

    keywords: [
      "science",
      "future",
      "technology",
      "space",
      "robot",
      "experiment",
      "alien",
      "artificial intelligence",
      "ai",
      "machine",
      "planet",
      "scientist",
      "dystopian",
      "android",
    ],
  },
};


/* =========================
   NORMALIZE
========================= */

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}


/* =========================
   GET MOOD PROFILE
========================= */

function getMoodProfile(mood) {
  return moodProfiles[mood] || null;
}


/* =========================
   GET MOOD SIGNALS
========================= */

function getMoodSignals(movie, mood) {
  const profile =
    getMoodProfile(mood);

  if (!profile) {
    return {
      score: 0,
      primaryGenreMatches: [],
      secondaryGenreMatches: [],
      keywordMatches: [],
      meaningfulMatch: false,
    };
  }

  const movieGenres = (
    movie.genres || []
  ).map(normalizeText);

  const primaryGenreMatches =
    profile.primaryGenres.filter(
      (genre) =>
        movieGenres.includes(
          normalizeText(genre)
        )
    );

  const secondaryGenreMatches =
    profile.secondaryGenres.filter(
      (genre) =>
        movieGenres.includes(
          normalizeText(genre)
        )
    );

  const title = normalizeText(
    movie.title
  );

  const overview = normalizeText(
    movie.overview
  );

  const keywordMatches = [];

  profile.keywords.forEach(
    (keyword) => {
      const normalizedKeyword =
        normalizeText(keyword);

      if (
        title.includes(
          normalizedKeyword
        ) ||
        overview.includes(
          normalizedKeyword
        )
      ) {
        keywordMatches.push(
          normalizedKeyword
        );
      }
    }
  );


  /*
    =========================
    MEANINGFUL MATCH
    =========================

    A movie must have real evidence
    for the selected mood.

    Rating alone can NEVER qualify
    a movie anymore.
  */

  const meaningfulMatch =
    primaryGenreMatches.length > 0 ||
    (secondaryGenreMatches.length > 0 &&
      keywordMatches.length > 0) ||
    keywordMatches.length >= 2;


  if (!meaningfulMatch) {
    return {
      score: 0,
      primaryGenreMatches,
      secondaryGenreMatches,
      keywordMatches,
      meaningfulMatch: false,
    };
  }


  /* =========================
     SCORE
  ========================= */

  let score = 0;

  /* Strong primary genre */

  score +=
    primaryGenreMatches.length * 7;

  /* Supporting genres */

  score +=
    secondaryGenreMatches.length * 3;


  /* =========================
     KEYWORDS
  ========================= */

  /*
    Limit keyword influence so a long
    overview doesn't overpower genres.
  */

  const usefulKeywords =
    keywordMatches.slice(0, 4);

  usefulKeywords.forEach(
    (keyword) => {

      if (
        title.includes(keyword)
      ) {
        score += 3;
      } else {
        score += 2;
      }

    }
  );


  /* =========================
     RATING
  ========================= */

  const rating =
    Number(movie.rating) || 0;

  if (rating >= 8.5) {
    score += 4;
  } else if (rating >= 8) {
    score += 3;
  } else if (rating >= 7) {
    score += 2;
  } else if (rating >= 6) {
    score += 1;
  }


  return {
    score,

    primaryGenreMatches,

    secondaryGenreMatches,

    keywordMatches,

    meaningfulMatch: true,
  };
}


/* =========================
   CALCULATE SCORE
========================= */

export function getRecommendationScore(
  movie,
  mood
) {
  if (mood === "All") {
    return movie.rating || 0;
  }

  return getMoodSignals(
    movie,
    mood
  ).score;
}


/* =========================
   GET MATCHING GENRES
========================= */

export function getMatchingGenres(
  movie,
  mood
) {
  if (mood === "All") {
    return movie.genres || [];
  }

  const signals =
    getMoodSignals(
      movie,
      mood
    );

  return [
    ...signals.primaryGenreMatches,
    ...signals.secondaryGenreMatches,
  ];
}


/* =========================
   RECOMMEND MOVIES
========================= */

export function recommendMovies(
  movies,
  mood
) {
  if (!movies?.length) {
    return [];
  }


  /* =========================
     ALL
  ========================= */

  if (mood === "All") {
    return [...movies]
      .sort(
        (a, b) =>
          (b.rating || 0) -
          (a.rating || 0)
      )
      .map((movie) => ({
        ...movie,

        recommendationScore:
          movie.rating || 0,

        matchingGenres:
          movie.genres || [],
      }));
  }


  /* =========================
     MOOD RESULTS
  ========================= */

  return movies
    .map((movie) => {

      const signals =
        getMoodSignals(
          movie,
          mood
        );

      return {
        ...movie,

        recommendationScore:
          signals.score,

        matchingGenres: [
          ...signals.primaryGenreMatches,
          ...signals.secondaryGenreMatches,
        ],

        keywordMatches:
          signals.keywordMatches,

        hasMoodMatch:
          signals.meaningfulMatch,
      };

    })


    /*
      IMPORTANT:

      Only movies with genuine mood
      evidence are allowed through.
    */

    .filter(
      (movie) =>
        movie.hasMoodMatch === true
    )


    /* =========================
       SORT
    ========================= */

    .sort((a, b) => {

      if (
        b.recommendationScore !==
        a.recommendationScore
      ) {
        return (
          b.recommendationScore -
          a.recommendationScore
        );
      }

      return (
        (b.rating || 0) -
        (a.rating || 0)
      );
    });
}