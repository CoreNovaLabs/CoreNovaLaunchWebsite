import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p className="not-found__desc">Page not found.</p>
      <Link to="/en" className="link-blue">
        Go home →
      </Link>
    </div>
  );
}
