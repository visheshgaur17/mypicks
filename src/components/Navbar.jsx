
function Navbar() {
  return (
    <nav className="navbar">
      
      <a
        href="/"
        className="navbar-logo"
      >
        MyPicks
      </a>


      <div className="navbar-links">

        <a href="#discover">
          Discover
        </a>

        <a href="#movies">
          Movies
        </a>

        <a href="#shows">
          Shows
        </a>

        <a href="#anime">
          Anime
        </a>

      </div>


      <button className="navbar-search">
        Search
      </button>

    </nav>
  );
}

export default Navbar;

