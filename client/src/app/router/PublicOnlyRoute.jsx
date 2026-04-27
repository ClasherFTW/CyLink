import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import Loader from "../../components/common/Loader";

function PublicOnlyRoute() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <Loader label="Preparing Citrus" fullscreen />;
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
