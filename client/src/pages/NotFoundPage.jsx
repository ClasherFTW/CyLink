import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <p>This page does not exist in CyLink.</p>
      <Link to="/" className="btn btn--primary">
        Go to Landing
      </Link>
    </div>
  );
}

export default NotFoundPage;
