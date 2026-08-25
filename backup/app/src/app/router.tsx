import { createBrowserRouter, Navigate } from "react-router-dom";

import AppLayout from "./layouts/app-layout";
import OnboardingLayout from "./layouts/onboarding-layout";

import WelcomePage from "../pages/onboarding/welcome";
import UploadResumePage from "../pages/onboarding/upload-resume";

import DashboardPage from "../pages/dashboard";
import ATSPage from "../pages/ats";
import JobsPage from "../pages/jobs";
import InterviewPage from "../pages/interview";
import CommunityPage from "../pages/community";
import ChatPage from "../pages/chat";
import SettingsPage from "../pages/settings";
import ErrorBoundary from "../components/ErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <OnboardingLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      /*
        ONBOARDING
      */
      {
        index: true,
        element: <WelcomePage />,
      },
      {
        path: "upload-resume",
        element: <UploadResumePage />,
      },

      /*
        APP
      */
      {
        path: "app",
        element: <AppLayout />,
        errorElement: <ErrorBoundary/>,
        children: [
          {
            index: true,
            element: (
              <Navigate
                to="/app/dashboard"
                replace
              />
            ),
          },
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "ats",
            element: <ATSPage />,
          },
          {
            path: "jobs",
            element: <JobsPage />,
          },
          {
            path: "interview",
            element: <InterviewPage />,
          },
          {
            path: "community",
            element: <CommunityPage />,
          },
          {
            path: "chat",
            element: <ChatPage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]);