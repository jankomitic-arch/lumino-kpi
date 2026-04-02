import { createBrowserRouter } from "react-router";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/dashboard/:year/:month",
    Component: DashboardPage,
  },
]);
