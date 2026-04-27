import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="landing-wrap">
      <header className="landing-top">
        <span className="brand-link">
          citrus
          <span className="brand-link__dot" />
        </span>

        <div className="landing-top__actions">
          <Link to="/auth" className="btn btn--ghost">
            Login
          </Link>
          <Link to="/auth" className="btn btn--primary">
            Join Citrus
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div>
          <p className="eyebrow">Developer Q&A workspace</p>
          <h1>Ask better questions. Ship fixes faster.</h1>
          <p>
            Citrus combines structured Q&A, voting, profiles, realtime chat, and AI-assisted help in one modern frontend.
          </p>
          <div className="inline-actions">
            <Link to="/auth" className="btn btn--primary">
              Start with Login
            </Link>
            <Link to="/app" className="btn btn--ghost">
              Open App
            </Link>
          </div>
        </div>

        <div className="landing-preview">
          <h3>Now included</h3>
          <ul>
            <li>Profiles with stats and activity</li>
            <li>Markdown editor + preview</li>
            <li>Edit/Delete for your posts</li>
            <li>Saved bookmarks and advanced filters</li>
            <li>Realtime chat and Citrus Bot context mode</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
