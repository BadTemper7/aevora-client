import { createBrowserRouter } from "react-router-dom";

import LoadingScreen from "../components/feedback/LoadingScreen";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import GuestRoute from "./guards/GuestRoute";
import ProtectedRoute from "./guards/ProtectedRoute";
import { PAGE_TITLES, ROUTES } from "./config/routes";

/** Code-split a page: the chunk loads when the route is first visited. */
const page = (load) => ({
  lazy: async () => ({ Component: (await load()).default }),
});

const comingSoon = () => import("../pages/ComingSoonPage");

// pages that appear in navigation but are not built yet
const placeholderPaths = [
  ROUTES.explore,
  ROUTES.friends,
  ROUTES.messages,
  ROUTES.notifications,
  ROUTES.videos,
  ROUTES.watch,
  ROUTES.gaming,
  ROUTES.communities,
  ROUTES.workspace,
  ROUTES.calendar,
  ROUTES.tasks,
  ROUTES.profile,
  ROUTES.settings,
];

// legal and support pages must be reachable while signed out
const publicPlaceholderPaths = [
  ROUTES.forgotPassword,
  ROUTES.terms,
  ROUTES.privacy,
  ROUTES.help,
];

const routes = [
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.login, ...page(() => import("../features/auth/pages/LoginPage")) },
          { path: ROUTES.register, ...page(() => import("../features/auth/pages/RegisterPage")) },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, ...page(() => import("../features/social/feed/pages/HomePage")) },
          ...placeholderPaths.map((path) => ({
            path,
            ...page(comingSoon),
            handle: { title: PAGE_TITLES[path] },
          })),
        ],
      },
    ],
  },

  ...publicPlaceholderPaths.map((path) => ({
    path,
    ...page(comingSoon),
    handle: { title: PAGE_TITLES[path], standalone: true },
  })),

  { path: "*", ...page(() => import("../pages/NotFoundPage")) },
];

export const router = createBrowserRouter([
  {
    // shown while the first lazy route loads
    hydrateFallbackElement: <LoadingScreen />,
    children: routes,
  },
]);
