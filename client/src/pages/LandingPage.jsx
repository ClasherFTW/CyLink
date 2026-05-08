import { Link } from "react-router-dom";
import BorderGlow from "../component/BorderGlow";
import LineWaves from "../components/LineWaves";

function LandingPage() {
  return (
    <div className="landing-wrap">
      <div className="landing-bg">
        <LineWaves
          speed={0.3}
          innerLineCount={32}
          outerLineCount={36}
          warpIntensity={1}
          rotation={-45}
          edgeFadeWidth={0}
          colorCycleSpeed={1}
          brightness={0.2}
          color1="#ffffff"
          color2="#ffffff"
          color3="#ffffff"
          enableMouseInteraction
          mouseInfluence={2}
        />
      </div>

      <BorderGlow
        className="landing-center"
        glowColor="32 100 58"
        backgroundColor="rgba(10, 12, 14, 0.62)"
        borderRadius={14}
        glowRadius={32}
        glowIntensity={0.9}
        coneSpread={18}
        animated
        colors={["#ff8c00", "#f5f7fa", "#38bdf8"]}
        fillOpacity={0.22}
      >
        <span className="brand-link">
          CyLink
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
      </BorderGlow>
    </div>
  );
}

export default LandingPage;
