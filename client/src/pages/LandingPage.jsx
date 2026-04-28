import { Link } from "react-router-dom";
import FloatingLines from "../components/background/FloatingLines";

function LandingPage() {
  return (
    <div className="landing-wrap">
      <div className="landing-bg">
        <FloatingLines
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={8}
          lineDistance={8}
          bendRadius={8}
          bendStrength={-2}
          interactive
          parallax
          animationSpeed={1}
          gradientStart="#e945f5"
          gradientMid="#6f6f6f"
          gradientEnd="#6a6a6a"
        />
      </div>

      <main className="landing-center">
        <span className="brand-link">
          citrus
          <span className="brand-link__dot" />
        </span>
        <h1>Ask. Solve. Share.</h1>
        <p>Developer Q&A with realtime chat and focused AI help.</p>
        <div className="landing-center__actions">
          <Link to="/auth" className="btn btn--primary">
            Get Started
          </Link>
          <Link to="/auth" className="btn btn--ghost">
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
