/* =========================
   CONTENT RECOMMENDER
   TF-IDF + COSINE SIMILARITY
========================= */


/* =========================
   STOP WORDS
========================= */

const stopWords = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "from",
  "by",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "this",
  "that",
  "as",
  "at",
  "it",
  "its",
  "into",
  "their",
  "they",
  "them",
  "his",
  "her",
  "he",
  "she",
  "we",
  "you",
  "your",
  "who",
  "what",
  "when",
  "where",
  "which",
  "while",
  "after",
  "before",
  "about",
  "through",
  "over",
  "under",
  "during",
  "from",
  "up",
  "down",
  "out",
  "than",
]);


/* =========================
   NORMALIZE TEXT
========================= */

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


/* =========================
   TOKENIZE
========================= */

function tokenize(text) {
  return normalizeText(text)
    .split(" ")
    .filter(
      (word) =>
        word.length > 2 &&
        !stopWords.has(word)
    );
}


/* =========================
   BUILD DOCUMENT TEXT
========================= */

function getMovieText(movie) {
  const title = movie.title || "";

  const overview =
    movie.overview || "";

  const genres = (
    movie.genres || []
  ).join(" ");

  /*
    Genres are repeated intentionally.

    This gives genre information more
    influence than ordinary overview words.
  */

  return `
    ${title}
    ${overview}
    ${genres} ${genres}
  `;
}


/* =========================
   TF-IDF MODEL
========================= */

export function buildContentModel(
  movies
) {
  const documents = movies.map(
    (movie) =>
      tokenize(
        getMovieText(movie)
      )
  );

  const documentCount =
    documents.length;

  /*
    Count how many documents contain
    each term.
  */

  const documentFrequency = new Map();

  documents.forEach((tokens) => {
    const uniqueTokens = new Set(
      tokens
    );

    uniqueTokens.forEach((token) => {
      documentFrequency.set(
        token,
        (documentFrequency.get(token) ||
          0) + 1
      );
    });
  });


  /*
    Calculate IDF.

    log((N + 1) / (DF + 1)) + 1
    keeps values stable even when a
    term appears in very few documents.
  */

  const idf = new Map();

  documentFrequency.forEach(
    (frequency, term) => {
      const value =
        Math.log(
          (documentCount + 1) /
            (frequency + 1)
        ) + 1;

      idf.set(term, value);
    }
  );


  /*
    Build TF-IDF vectors.
  */

  const vectors = new Map();

  movies.forEach((movie, index) => {
    const tokens =
      documents[index];

    const termFrequency = new Map();

    tokens.forEach((token) => {
      termFrequency.set(
        token,
        (termFrequency.get(token) ||
          0) + 1
      );
    });

    const vector = new Map();

    termFrequency.forEach(
      (frequency, term) => {
        const termIdf =
          idf.get(term);

        if (!termIdf) {
          return;
        }

        const tf =
          frequency / tokens.length;

        vector.set(
          term,
          tf * termIdf
        );
      }
    );

    vectors.set(
      getMovieKey(movie),
      vector
    );
  });

  return {
    idf,
    vectors,
  };
}


/* =========================
   MOVIE KEY
========================= */

export function getMovieKey(movie) {
  return `${movie.type}:${movie.id}`;
}


/* =========================
   COSINE SIMILARITY
========================= */

export function cosineSimilarity(
  vectorA,
  vectorB
) {
  if (
    !vectorA?.size ||
    !vectorB?.size
  ) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  vectorA.forEach((valueA, term) => {
    const valueB =
      vectorB.get(term) || 0;

    dotProduct +=
      valueA * valueB;

    magnitudeA +=
      valueA * valueA;
  });

  vectorB.forEach((valueB) => {
    magnitudeB +=
      valueB * valueB;
  });

  if (
    magnitudeA === 0 ||
    magnitudeB === 0
  ) {
    return 0;
  }

  return (
    dotProduct /
    (
      Math.sqrt(magnitudeA) *
      Math.sqrt(magnitudeB)
    )
  );
}


/* =========================
   BUILD USER PROFILE
========================= */

export function buildUserProfile(
  movies,
  watchlist,
  model
) {
  if (
    !watchlist?.length ||
    !movies?.length ||
    !model?.vectors
  ) {
    return null;
  }

  const profile = new Map();

  let matchedMovies = 0;

  watchlist.forEach(
    (savedMovie) => {
      const key =
        getMovieKey(savedMovie);

      const vector =
        model.vectors.get(key);

      if (!vector) {
        return;
      }

      matchedMovies++;

      vector.forEach(
        (value, term) => {
          profile.set(
            term,
            (profile.get(term) || 0) +
              value
          );
        }
      );
    }
  );

  if (matchedMovies === 0) {
    return null;
  }

  /*
    Average the vectors so that adding
    more movies doesn't simply increase
    every value indefinitely.
  */

  profile.forEach(
    (value, term) => {
      profile.set(
        term,
        value / matchedMovies
      );
    }
  );

  return profile;
}


/* =========================
   GET CONTENT SCORE
========================= */

export function getContentScore(
  movie,
  model,
  userProfile
) {
  if (!userProfile) {
    return 0;
  }

  const movieVector =
    model.vectors.get(
      getMovieKey(movie)
    );

  if (!movieVector) {
    return 0;
  }

  return cosineSimilarity(
    movieVector,
    userProfile
  );
}


/* =========================
   CONTENT RECOMMENDATIONS
========================= */

export function recommendByContent(
  movies,
  watchlist,
  limit = 10
) {
  if (
    !movies?.length ||
    !watchlist?.length
  ) {
    return [];
  }

  const model =
    buildContentModel(movies);

  const userProfile =
    buildUserProfile(
      movies,
      watchlist,
      model
    );

  if (!userProfile) {
    return [];
  }

  const watchlistKeys =
    new Set(
      watchlist.map(getMovieKey)
    );

  return movies
    .filter(
      (movie) =>
        !watchlistKeys.has(
          getMovieKey(movie)
        )
    )
    .map((movie) => ({
      ...movie,

      contentScore:
        getContentScore(
          movie,
          model,
          userProfile
        ),
    }))
    .filter(
      (movie) =>
        movie.contentScore > 0
    )
    .sort(
      (a, b) =>
        b.contentScore -
        a.contentScore
    )
    .slice(0, limit);
}