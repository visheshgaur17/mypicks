import {
  getRecommendationScore,
  getMatchingGenres,
} from "./recommendations";

import {
  buildContentModel,
  buildUserProfile,
  getContentScore,
  getMovieKey,
} from "./contentRecommender";


/* =========================
   HYBRID RECOMMENDER
========================= */

export function hybridRecommend(
  movies,
  watchlist,
  mood = "All",
  limit = 6
) {
  if (!movies?.length) {
    return [];
  }


  /* =========================
     BUILD CONTENT MODEL
  ========================= */

  const contentModel =
    buildContentModel(movies);

  const userProfile =
    buildUserProfile(
      movies,
      watchlist,
      contentModel
    );


  /* =========================
     WATCHLIST KEYS
  ========================= */

  const watchlistKeys =
    new Set(
      (watchlist || []).map(
        getMovieKey
      )
    );


  /* =========================
     MOOD ELIGIBILITY
  ========================= */

  /*
    IMPORTANT:

    Mood is now an eligibility filter.

    For example:

    Crime selected
    ↓
    Only genuine Crime matches
    ↓
    Then TF-IDF decides which of
    those Crime titles are closest
    to the user's watchlist.

    This prevents a highly similar
    Horror title from appearing in
    the Crime personalized section.
  */

  const moodEligibleMovies =
    mood === "All"
      ? movies
      : movies.filter((movie) => {
          const moodScore =
            getRecommendationScore(
              movie,
              mood
            );

          return moodScore > 0;
        });


  /* =========================
     SCORE MOVIES
  ========================= */

  const scoredMovies =
    moodEligibleMovies

      /*
        Never recommend something
        already saved.
      */
      .filter(
        (movie) =>
          !watchlistKeys.has(
            getMovieKey(movie)
          )
      )

      .map((movie) => {

        /* =========================
           MOOD SCORE
        ========================= */

        const moodScore =
          mood === "All"
            ? 0
            : getRecommendationScore(
                movie,
                mood
              );


        /* =========================
           CONTENT SIMILARITY
        ========================= */

        const contentScore =
          userProfile
            ? getContentScore(
                movie,
                contentModel,
                userProfile
              )
            : 0;


        /*
          Convert similarity from
          approximately 0–1 into a
          useful ranking contribution.
        */

        const contentPoints =
          contentScore * 12;


        /* =========================
           RATING BONUS
        ========================= */

        const rating =
          Number(movie.rating) || 0;

        let ratingPoints = 0;

        if (rating >= 8.5) {
          ratingPoints = 4;
        } else if (rating >= 8) {
          ratingPoints = 3;
        } else if (rating >= 7) {
          ratingPoints = 2;
        } else if (rating >= 6) {
          ratingPoints = 1;
        }


        /* =========================
           FINAL SCORE
        ========================= */

        const finalScore =
          moodScore +
          contentPoints +
          ratingPoints;


        return {
          ...movie,

          moodScore,

          contentScore,

          contentPoints,

          ratingPoints,

          finalScore,

          matchingGenres:
            getMatchingGenres(
              movie,
              mood
            ),
        };
      });


  /* =========================
     SORT
  ========================= */

  return scoredMovies
    .filter(
      (movie) =>
        movie.finalScore > 0
    )
    .sort((a, b) => {

      /*
        Primary:
        final hybrid score
      */

      if (
        b.finalScore !==
        a.finalScore
      ) {
        return (
          b.finalScore -
          a.finalScore
        );
      }


      /*
        Secondary:
        content similarity
      */

      if (
        b.contentScore !==
        a.contentScore
      ) {
        return (
          b.contentScore -
          a.contentScore
        );
      }


      /*
        Final tie-breaker:
        TMDB rating
      */

      return (
        (b.rating || 0) -
        (a.rating || 0)
      );
    })
    .slice(0, limit);
}