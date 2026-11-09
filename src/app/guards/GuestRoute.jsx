import { Navigate, Outlet, useLocation } from "react-router-dom";

import { selectIsAuthenticated, useAuthStore } from "../../stores/authStore";
import { ROUTES } from "../config/routes";

/** Login and register are for signed-out people. Signed-in people go back to the app. */
export default function GuestRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname ?? ROUTES.home;
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}
