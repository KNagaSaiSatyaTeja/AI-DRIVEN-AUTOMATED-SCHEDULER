
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./Dashboard";
import Users from "./Users";
import NotFound from "./NotFound";
import Rooms from "./Rooms";
import RoomDetail from "./RoomDetail";
import AuthPage from "./Auth";
import { useAuth } from "@/hooks/useAuth";

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/users" element={<Users />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/rooms/:roomId" element={<RoomDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/*" element={user ? <AppRoutes /> : <Navigate to="/auth" replace />} />
    </Routes>
  );
};

export default Index;
