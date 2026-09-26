
import { useEffect, useMemo, useState } from "react";
import movies from "./data/movies";

import {
  searchMovie,
  getPosterUrl,
  getBackdropUrl,
  getGenreNames,
} from "./api/tmdb";

import { recommendMovies } from "./utils/recommendations";
import { hybridRecommend } from "./utils/hybridRecommender";

import "./App.css";

function App() {
  const [movieData, setMovieData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedMood, setSelectedMood] = useState("All");
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const savedWatchlist =
        localStorage.getItem("movieWatchlist");

      return savedWatchlist
        ? JSON.parse(savedWatchlist)
        : [];
    } catch {
      return [];
    }
  });

  const [showWatchlist, setShowWatchlist] =
    useState(false);

  const MOVIES_PER_PAGE = 120;

  const [currentPage, setCurrentPage] =
    useState(1);

  /* =========================
     SAVE WATCHLIST
  ========================= */

  useEffect(() => {
    localStorage.setItem(
      "movieWatchlist",
      JSON.stringify(watchlist)
    );
  }, [watchlist]);

  /* =========================
     ADD TO WATCHLIST
  ========================= */

  const addToWatchlist = (movie) => {
    setWatchlist((current) => {
      const alreadyExists = current.some(
        (item) =>
          item.id === movie.id &&
          item.type === movie.type
      );

      if (alreadyExists) {
        return current;
      }

      return [...current, movie];
    });
  };

  /* =========================
     REMOVE FROM WATCHLIST
  ========================= */

  const removeFromWatchlist = (movie) => {
    setWatchlist((current) =>
      current.filter(
        (item) =>
          !(
            item.id === movie.id &&
            item.type === movie.type
          )
      )
    );
  };

  /* =========================
     CHECK WATCHLIST
  ========================= */

  const isInWatchlist = (movie) => {
    return watchlist.some(
      (item) =>
        item.id === movie.id &&
        item.type === movie.type
    );
  };

  /* =========================
     LOAD MOVIES FROM TMDB
  ========================= */

  useEffect(() => {
    async function loadMovies() {
      try {
        setError(null);

        const uniqueTitles = [
          ...new Set(
            movies.map((title) =>
              title.trim()
            )
          ),
        ];

        console.log(
          "TOTAL UNIQUE TITLES:",
          uniqueTitles.length
        );

        const results = [];

        /*
          Process 5 titles at a time.
        */

        for (
          let i = 0;
          i < uniqueTitles.length;
          i += 5
        ) {
          const batch =
            uniqueTitles.slice(
              i,
              i + 5
            );

          const batchResults =
            await Promise.all(
              batch.map(async (title) => {
                try {
                  console.log(
                    "Searching TMDB:",
                    title
                  );

                  const tmdbResults =
                    await searchMovie(title);

                  const normalizedTitle =
                    title
                      .toLowerCase()
                      .trim();

                  /* =========================
                     CANDIDATES
                  ========================= */

                  const candidates =
                    tmdbResults.filter(
                      (item) =>
                        item.media_type ===
                          "movie" ||
                        item.media_type ===
                          "tv"
                    );

                  /* =========================
                     EXACT TITLE MATCHES
                  ========================= */

                  const exactMatches =
                    candidates.filter(
                      (item) => {
                        const itemTitle =
                          (
                            item.title ||
                            item.name ||
                            ""
                          )
                            .toLowerCase()
                            .trim();

                        const originalTitle =
                          (
                            item.original_title ||
                            item.original_name ||
                            ""
                          )
                            .toLowerCase()
                            .trim();

                        return (
                          itemTitle ===
                            normalizedTitle ||
                          originalTitle ===
                            normalizedTitle
                        );
                      }
                    );

                  /* =========================
                     SELECT BEST MATCH
                  ========================= */

                  const rankedMatches =
                    [...exactMatches].sort(
                      (a, b) => {
                        const aTitle =
                          (
                            a.title ||
                            a.name ||
                            ""
                          )
                            .toLowerCase()
                            .trim();

                        const bTitle =
                          (
                            b.title ||
                            b.name ||
                            ""
                          )
                            .toLowerCase()
                            .trim();

                        const aDisplayExact =
                          aTitle ===
                          normalizedTitle;

                        const bDisplayExact =
                          bTitle ===
                          normalizedTitle;

                        if (
                          aDisplayExact !==
                          bDisplayExact
                        ) {
                          return aDisplayExact
                            ? -1
                            : 1;
                        }

                        const popularityDifference =
                          (b.popularity || 0) -
                          (a.popularity || 0);

                        if (
                          popularityDifference !==
                          0
                        ) {
                          return popularityDifference;
                        }

                        return (
                          (b.vote_count || 0) -
                          (a.vote_count || 0)
                        );
                      }
                    );

                  const match =
                    rankedMatches[0] || null;

                  if (!match) {
                    console.log(
                      "No exact match:",
                      title
                    );

                    return null;
                  }

                  console.log(
                    `Selected TMDB match for "${title}":`,
                    match.title ||
                      match.name,
                    match.media_type,
                    match.id
                  );

                  /* =========================
                     RETURN ONE TITLE
                  ========================= */

                  return {
                    id: match.id,

                    title:
                      match.title ||
                      match.name,

                    originalTitle:
                      match.original_title ||
                      match.original_name ||
                      match.title ||
                      match.name,

                    type:
                      match.media_type,

                    year: (
                      match.release_date ||
                      match.first_air_date ||
                      ""
                    ).slice(0, 4),

                    releaseDate:
                      match.release_date ||
                      match.first_air_date ||
                      "",

                    overview:
                      match.overview ||
                      "No description available.",

                    rating:
                      match.vote_average,

                    voteCount:
                      match.vote_count ||
                      0,

                    popularity:
                      match.popularity ||
                      0,

                    language:
                      match.original_language ||
                      "Unknown",

                    genres:
                      getGenreNames(
                        match.genre_ids,
                        match.media_type
                      ),

                    poster:
                      getPosterUrl(
                        match.poster_path
                      ),

                    backdrop:
                      getBackdropUrl(
                        match.backdrop_path
                      ),

                    tmdb: match,
                  };

                } catch (err) {
                  console.error(
                    `Failed to load "${title}":`,
                    err
                  );

                  return null;
                }
              })
            );

          const validResults =
            batchResults.filter(Boolean);

          results.push(
            ...validResults
          );

          setMovieData([
            ...results,
          ]);

          console.log(
            `Loaded ${results.length} titles so far`
          );
        }

        console.log(
          "FINAL MOVIE DATA:",
          results
        );

        setMovieData(results);

      } catch (err) {
        console.error(
          "TMDB ERROR:",
          err
        );

        setError(err.message);
      }
    }

    loadMovies();
  }, []);

  /* =========================
     FEATURED MOVIE
  ========================= */

  const featuredMovie = useMemo(() => {
    if (!movieData.length) {
      return null;
    }

    return (
      movieData.find(
        (movie) =>
          movie.title.toLowerCase() ===
          "the wailing"
      ) || movieData[0]
    );
  }, [movieData]);

  /* =========================
     MOODS
  ========================= */

  const moods = [
    "All",
    "Dark",
    "Mystery",
    "Psychological",
    "Crime",
    "Mind-Bending",
    "Horror",
    "Sci-Fi",
  ];

  /* =========================
     MOOD RECOMMENDATIONS
  ========================= */

  const filteredMovies = useMemo(() => {
    return recommendMovies(
      movieData,
      selectedMood
    );
  }, [movieData, selectedMood]);

  /* =========================
     HYBRID PERSONALIZED
     RECOMMENDATIONS
  ========================= */

  const personalizedMovies = useMemo(() => {
    return hybridRecommend(
      movieData,
      watchlist,
      selectedMood,
      6
    );
  }, [
    movieData,
    watchlist,
    selectedMood,
  ]);

  /* =========================
     PAGINATION
  ========================= */

  const totalPages = Math.ceil(
    filteredMovies.length /
      MOVIES_PER_PAGE
  );

  const paginatedMovies = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      MOVIES_PER_PAGE;

    return filteredMovies.slice(
      startIndex,
      startIndex +
        MOVIES_PER_PAGE
    );
  }, [
    filteredMovies,
    currentPage,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMood]);

  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  /* =========================
     FIND SOMETHING
  ========================= */

  const findSomething = () => {
    if (!filteredMovies.length) {
      return;
    }

    const randomIndex = Math.floor(
      Math.random() *
        filteredMovies.length
    );

    const randomMovie =
      filteredMovies[randomIndex];

    setSelectedMovie(randomMovie);
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="app">

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="navbar">

        <div className="logo">

          <div className="logo-mark">
            M
          </div>

          <span>
            Movie Discovery
          </span>

        </div>

        <div className="nav-links">

          <a href="#discover">
            Discover
          </a>

          <a href="#curated">
            Curated
          </a>

          <a href="#about">
            About
          </a>

        </div>

        <button
          className="nav-button"
          onClick={() =>
            setShowWatchlist(true)
          }
        >
          My Watchlist

          {watchlist.length > 0 && (
            <span className="watchlist-count">
              {watchlist.length}
            </span>
          )}
        </button>

      </nav>


      {/* =========================
          HERO
      ========================= */}

      <section
        id="discover"
        className="hero"
        style={
          featuredMovie?.backdrop
            ? {
                backgroundImage: `
                  linear-gradient(
                    90deg,
                    rgba(13, 16, 20, 0.98) 0%,
                    rgba(13, 16, 20, 0.90) 35%,
                    rgba(13, 16, 20, 0.55) 65%,
                    rgba(13, 16, 20, 0.88) 100%
                  ),
                  url(${featuredMovie.backdrop})
                `,
              }
            : {}
        }
      >

        <div className="hero-content">

          <div className="hero-label">
            PERSONAL MOVIE DISCOVERY
          </div>

          <h1>
            Find something
            <br />
            <span>
              worth watching.
            </span>
          </h1>

          <p className="hero-description">
            A curated collection of movies
            and series for people who want
            something beyond the usual
            recommendations.
          </p>

          <div className="hero-actions">

            <button
              className="primary-button"
              onClick={findSomething}
              disabled={
                !filteredMovies.length
              }
            >
              Find Something
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                document
                  .getElementById(
                    "curated"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Explore Collection
            </button>

          </div>

        </div>


        {/* FEATURED MOVIE */}

        {featuredMovie && (

          <div
            className="hero-movie"
            onClick={() =>
              setSelectedMovie(
                featuredMovie
              )
            }
          >

            {featuredMovie.poster && (

              <img
                src={featuredMovie.poster}
                alt={featuredMovie.title}
              />

            )}

            <div className="hero-movie-info">

              <span>
                FEATURED PICK
              </span>

              <h2>
                {featuredMovie.title}
              </h2>

              <p>
                {featuredMovie.year}
                {" · "}

                {featuredMovie.rating
                  ? `${featuredMovie.rating.toFixed(
                      1
                    )} TMDB`
                  : "Unrated"}
              </p>

            </div>

          </div>

        )}


        <div className="hero-note">

          <span>
            Curated picks
          </span>

          <span>
            TMDB powered
          </span>

          <span>
            Personal recommendations
          </span>

        </div>

      </section>


      {/* =========================
          MOOD PICKER
      ========================= */}

      <section
        id="mood-picker"
        className="mood-section"
      >

        <div className="section-header">

          <div>

            <p className="section-label">
              WHAT ARE YOU LOOKING FOR?
            </p>

            <h2>
              Pick a mood.
            </h2>

          </div>

          <p className="section-description">
            Tell me what kind of story you
            want tonight. I'll narrow down
            the collection.
          </p>

        </div>


        <div className="mood-buttons">

          {moods.map((mood) => (

            <button
              key={mood}
              className={
                selectedMood === mood
                  ? "mood-button active"
                  : "mood-button"
              }
              onClick={() =>
                setSelectedMood(mood)
              }
            >
              {mood}
            </button>

          ))}

        </div>

      </section>


      {/* =========================
          PERSONALIZED PICKS
      ========================= */}

      {watchlist.length > 0 &&
        personalizedMovies.length > 0 && (

          <section
            className="personalized-section"
          >

            <div className="section-header">

              <div>

                <p className="section-label">
                  TOP PICKS FOR YOU
                </p>

                <h2>
                  Based on your watchlist.
                </h2>

              </div>

              <p className="section-description">
                {personalizedMovies.length}{" "}
                personalized{" "}
                {personalizedMovies.length === 1
                  ? "recommendation"
                  : "recommendations"}{" "}
                based on your saved titles
                {selectedMood !== "All"
                  ? ` and your ${selectedMood} mood.`
                  : "."}
              </p>

            </div>


            <div className="movie-grid">

              {personalizedMovies.map(
                (movie) => (

                  <article
                    className="movie-card"
                    key={`personal-${movie.type}-${movie.id}`}
                    onClick={() =>
                      setSelectedMovie(movie)
                    }
                  >

                    <div className="movie-poster">

                      {movie.poster && (

                        <img
                          src={movie.poster}
                          alt={movie.title}
                        />

                      )}

                      <div className="movie-rating">

                        {movie.rating
                          ? movie.rating.toFixed(
                              1
                            )
                          : "N/A"}

                      </div>

                    </div>


                    <div className="movie-info">

                      <div className="movie-meta">

                        <span>
                          {movie.type ===
                          "movie"
                            ? "MOVIE"
                            : "SERIES"}
                        </span>

                        <span>
                          {movie.year}
                        </span>

                      </div>


                      <h3>
                        {movie.title}
                      </h3>


                      <p className="movie-genres">
                        Similar to your
                        watchlist
                      </p>


                      <p>
                        {movie.overview ||
                          "No description available."}
                      </p>

                    </div>

                  </article>

                )
              )}

            </div>


            {/* EXPLORE FULL COLLECTION */}

            <button
              className="secondary-button personalized-explore-button"
              onClick={() =>
                document
                  .getElementById(
                    "curated"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Explore all{" "}
              {selectedMood === "All"
                ? "titles"
                : selectedMood}
            </button>

          </section>
        )}


      {/* =========================
          MOVIE COLLECTION
      ========================= */}

      <section
        id="curated"
        className="movie-section"
      >

        <div className="section-header">

          <div>

            <p className="section-label">

              {selectedMood === "All"
                ? "HANDPICKED"
                : `FOR ${selectedMood.toUpperCase()}`}

            </p>

            <h2>

              {selectedMood === "All"
                ? "Explore the collection."
                : `Explore all ${selectedMood}.`}

            </h2>

          </div>

          <p className="section-description">

            {filteredMovies.length}{" "}

            {filteredMovies.length === 1
              ? "title"
              : "titles"}

            {" "}in this collection.

          </p>

        </div>


        {/* ERROR */}

        {error && (

          <p className="movie-error">
            Unable to load movies: {error}
          </p>

        )}


        {/* LOADING */}

        {!error &&
          movieData.length === 0 && (

            <p className="movie-loading">
              Loading your collection...
            </p>

          )}


        {/* EMPTY MOOD */}

        {!error &&
          movieData.length > 0 &&
          filteredMovies.length === 0 && (

            <div className="empty-results">

              <h3>
                Nothing here yet.
              </h3>

              <p>
                This collection is still
                growing. Try another mood.
              </p>

            </div>

          )}


        {/* MOVIE GRID */}

        <div className="movie-grid">

          {paginatedMovies.map((movie) => (

            <article
              className="movie-card"
              key={`${movie.type}-${movie.id}`}
              onClick={() =>
                setSelectedMovie(movie)
              }
            >

              <div className="movie-poster">

                {movie.poster && (

                  <img
                    src={movie.poster}
                    alt={movie.title}
                  />

                )}

                <div className="movie-rating">

                  {movie.rating
                    ? movie.rating.toFixed(1)
                    : "N/A"}

                </div>

              </div>


              <div className="movie-info">

                <div className="movie-meta">

                  <span>
                    {movie.type === "movie"
                      ? "MOVIE"
                      : "SERIES"}
                  </span>

                  <span>
                    {movie.year}
                  </span>

                </div>


                <h3>
                  {movie.title}
                </h3>


                {movie.matchingGenres?.length > 0 && (

                  <p className="movie-genres">
                    Strong match ·{" "}
                    {movie.matchingGenres.join(
                      " · "
                    )}
                  </p>

                )}


                <p>
                  {movie.overview ||
                    "No description available."}
                </p>

              </div>

            </article>

          ))}

        </div>


        {/* PAGINATION */}

        {totalPages > 1 && (

          <div className="pagination">

            <button
              className="pagination-button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) => page - 1
                )
              }
            >
              Previous
            </button>


            <div className="pagination-pages">

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) =>
                  index + 1
              ).map((page) => (

                <button
                  key={page}
                  className={
                    currentPage === page
                      ? "pagination-page active"
                      : "pagination-page"
                  }
                  onClick={() =>
                    setCurrentPage(page)
                  }
                >
                  {page}
                </button>

              ))}

            </div>


            <button
              className="pagination-button"
              disabled={
                currentPage === totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) => page + 1
                )
              }
            >
              Next
            </button>

          </div>

        )}

      </section>


      {/* =========================
          ABOUT
      ========================= */}

      <section
        id="about"
        className="about-section"
      >

        <p className="section-label">
          THE IDEA
        </p>

        <h2>
          Less scrolling.
          <br />
          Better recommendations.
        </h2>

        <p>
          This project started as a
          personal experiment in building
          a movie discovery system around
          the kind of stories I actually
          enjoy watching.
        </p>

      </section>


      {/* =========================
          MOVIE DETAILS MODAL
      ========================= */}

      {selectedMovie && (

        <div
          className="movie-modal"
          onClick={() =>
            setSelectedMovie(null)
          }
        >

          <div
            className="movie-modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="movie-modal-close"
              onClick={() =>
                setSelectedMovie(null)
              }
            >
              ×
            </button>


            {/* BACKDROP */}

            {selectedMovie.backdrop && (

              <div className="movie-modal-backdrop">

                <img
                  src={selectedMovie.backdrop}
                  alt=""
                />

              </div>

            )}


            <div className="movie-modal-body">

              <div className="movie-modal-poster">

                {selectedMovie.poster && (

                  <img
                    src={selectedMovie.poster}
                    alt={selectedMovie.title}
                  />

                )}

              </div>


              <div className="movie-modal-info">

                <div className="movie-modal-type">

                  {selectedMovie.type ===
                  "movie"
                    ? "MOVIE"
                    : "SERIES"}

                  {" · "}

                  {selectedMovie.year}

                </div>


                <h2>
                  {selectedMovie.title}
                </h2>


                <div className="movie-modal-stats">

                  <div className="movie-modal-stat">

                    <span className="stat-value">
                      {selectedMovie.rating
                        ? selectedMovie.rating.toFixed(
                            1
                          )
                        : "N/A"}
                    </span>

                    <span className="stat-label">
                      TMDB
                    </span>

                  </div>


                  <div className="movie-modal-stat">

                    <span className="stat-value">
                      {selectedMovie.year ||
                        "N/A"}
                    </span>

                    <span className="stat-label">
                      YEAR
                    </span>

                  </div>

                </div>


                {selectedMovie.originalTitle &&
                  selectedMovie.originalTitle !==
                    selectedMovie.title && (

                    <p className="movie-original-title">
                      Original title:{" "}
                      <span>
                        {selectedMovie.originalTitle}
                      </span>
                    </p>

                  )}


                {selectedMovie.language && (

                  <p className="movie-language">
                    Original language:{" "}
                    <span>
                      {selectedMovie.language.toUpperCase()}
                    </span>
                  </p>

                )}


                {/* UNIQUE GENRES */}

                {(() => {
                  const genres = [
                    ...(selectedMovie
                      .matchingGenres || []),

                    ...(selectedMovie.genres || []),
                  ];

                  const uniqueGenres = [
                    ...new Map(
                      genres.map((genre) => [
                        genre.toLowerCase(),
                        genre,
                      ])
                    ).values(),
                  ];

                  return uniqueGenres.length > 0 ? (

                    <div className="movie-modal-genres">

                      {uniqueGenres.map(
                        (genre) => (

                          <span key={genre}>
                            {genre}
                          </span>

                        )
                      )}

                    </div>

                  ) : null;
                })()}


                <p className="movie-modal-overview">

                  {selectedMovie.overview ||
                    "No description available."}

                </p>


                <button
                  className="primary-button"
                  onClick={() => {

                    if (
                      isInWatchlist(
                        selectedMovie
                      )
                    ) {
                      removeFromWatchlist(
                        selectedMovie
                      );
                    } else {
                      addToWatchlist(
                        selectedMovie
                      );
                    }

                  }}
                >

                  {isInWatchlist(
                    selectedMovie
                  )
                    ? "✓ In Watchlist"
                    : "+ Add to Watchlist"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* =========================
          WATCHLIST MODAL
      ========================= */}

      {showWatchlist && (

        <div
          className="movie-modal"
          onClick={() =>
            setShowWatchlist(false)
          }
        >

          <div
            className="watchlist-modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="movie-modal-close"
              onClick={() =>
                setShowWatchlist(false)
              }
            >
              ×
            </button>


            <div className="watchlist-header">

              <p className="section-label">
                YOUR COLLECTION
              </p>

              <h2>
                My Watchlist
              </h2>

              <p>
                {watchlist.length === 0
                  ? "Nothing saved yet."
                  : `${watchlist.length} ${
                      watchlist.length === 1
                        ? "title"
                        : "titles"
                    } saved.`}
              </p>

            </div>


            {watchlist.length === 0 ? (

              <div className="watchlist-empty">

                <h3>
                  Your watchlist is empty.
                </h3>

                <p>
                  Open a movie or series and
                  add it here when you find
                  something worth watching.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    setShowWatchlist(false)
                  }
                >
                  Explore Collection
                </button>

              </div>

            ) : (

              <div className="watchlist-grid">

                {watchlist.map((movie) => (

                  <article
                    className="watchlist-card"
                    key={`${movie.type}-${movie.id}`}
                    onClick={() => {

                      setShowWatchlist(false);

                      setSelectedMovie(movie);

                    }}
                  >

                    <div className="watchlist-poster">

                      {movie.poster && (

                        <img
                          src={movie.poster}
                          alt={movie.title}
                        />

                      )}

                    </div>


                    <div className="watchlist-info">

                      <span>

                        {movie.type === "movie"
                          ? "MOVIE"
                          : "SERIES"}

                        {" · "}

                        {movie.year}

                      </span>


                      <h3>
                        {movie.title}
                      </h3>


                      <p>

                        {movie.rating
                          ? `${movie.rating.toFixed(
                              1
                            )} TMDB`
                          : "Unrated"}

                      </p>


                      <button
                        className="watchlist-remove"
                        onClick={(event) => {

                          event.stopPropagation();

                          removeFromWatchlist(
                            movie
                          );

                        }}
                      >
                        Remove
                      </button>

                    </div>

                  </article>

                ))}

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default App;

