const moods = [
  "Mind-bending",
  "Dark & disturbing",
  "Fast-paced",
  "Mystery",
  "Psychological",
  "Emotional",
  "Crime",
  "Underrated",
];

function Discovery() {
  return (
    <section className="discovery-section" id="discover">
      <div className="discovery-heading">
        <p className="section-eyebrow">WHAT ARE YOU IN THE MOOD FOR?</p>

        <h2>
          Don't know what to watch?
          <br />
          <span>Tell us the vibe.</span>
        </h2>

        <p>
          Pick a few things you're in the mood for and we'll
          narrow down the possibilities.
        </p>
      </div>

      <div className="mood-grid">
        {moods.map((mood) => (
          <button key={mood} className="mood-card">
            {mood}
          </button>
        ))}
      </div>

      <button className="discover-button">
        Find my next watch
      </button>
    </section>
  );
}

export default Discovery;