import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "../../pages/LandingPage";
import AuthPage from "../../pages/AuthPage";
import MainPage from "../../pages/MainPage";
import QuestionDetailPage from "../../pages/QuestionDetailPage";
import ProfilePage from "../../pages/ProfilePage";
import UserProfilePage from "../../pages/UserProfilePage";
import ChatPage from "../../pages/ChatPage";
import NotFoundPage from "../../pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/auth" element={<AuthPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<MainPage />} />
        <Route path="/app/questions/:questionId" element={<QuestionDetailPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />
        <Route path="/app/users/:userId" element={<UserProfilePage />} />
        <Route path="/app/chat" element={<ChatPage />} />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default AppRouter;
