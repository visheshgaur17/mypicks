
const BASE_URL = "https://api.themoviedb.org/3";

const token = import.meta.env.VITE_TMDB_TOKEN;


/*
  =========================
  SEARCH TMDB
  =========================
*/

export async function searchMovie(title) {
  console.log("Searching TMDB:", title);

  const response = await fetch(
    `${BASE_URL}/search/multi?query=${encodeURIComponent(
      title
    )}&include_adult=false&language=en-US`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    }
  );

  const data = await response.json();

  console.log(
    "TMDB STATUS:",
    response.status,
    title
  );

  if (!response.ok) {
    throw new Error(
      data.status_message ||
        `TMDB request failed: ${response.status}`
    );
  }

  return data.results || [];
}


/*
  =========================
  TMDB GENRE IDs
  =========================
*/

const movieGenres = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const tvGenres = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};


/*
  =========================
  CONVERT GENRE IDs
  =========================
*/

export function getGenreNames(
  genreIds = [],
  type = "movie"
) {
  const genreMap =
    type === "tv"
      ? tvGenres
      : movieGenres;

  return genreIds
    .map((id) => genreMap[id])
    .filter(Boolean);
}


/*
  =========================
  POSTER
  =========================
*/

export function getPosterUrl(path) {
  if (!path) return null;

  return `https://image.tmdb.org/t/p/w500${path}`;
}


/*
  =========================
  BACKDROP
  =========================
*/

export function getBackdropUrl(path) {
  if (!path) return null;

  return `https://image.tmdb.org/t/p/w1280${path}`;
}
