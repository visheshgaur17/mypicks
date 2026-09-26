function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-content">

        <p className="hero-eyebrow">
          MOVIES · SHOWS · ANIME
        </p>

        <h1>
          Find something
          <br />
          <span>worth watching.</span>
        </h1>

        <p className="hero-description">
          Recommendations for when you've watched everything
          everyone keeps recommending.
        </p>

        <div className="hero-actions">
          <button className="hero-primary-btn">
            Discover something
          </button>

          <button className="hero-secondary-btn">
            Surprise me
          </button>
        </div>

      </div>
    </section>
  );
}

export default Hero;