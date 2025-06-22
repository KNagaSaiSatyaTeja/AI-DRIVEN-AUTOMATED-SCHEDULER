
// import { Routes, Route, Navigate } from "react-router-dom";
// import { Layout } from "@/components/layout/Layout";
// import Dashboard from "./Dashboard";
// import Users from "./Users";
// import NotFound from "./NotFound";
// import Rooms from "./Rooms";
// import RoomDetail from "./RoomDetail";
// import LoginPage from "./Login";
// import { useApp } from "@/context/AppContext";

// const AppRoutes = () => (
//   <Layout>
//     <Routes>
//       <Route path="/" element={<Dashboard />} />
//       <Route path="/users" element={<Users />} />
//       <Route path="/rooms" element={<Rooms />} />
//       <Route path="/rooms/:roomId" element={<RoomDetail />} />
//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   </Layout>
// );

// const Index = () => {
//   const { role } = useApp();

//   return (
//     <Routes>
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/*" element={role ? <AppRoutes /> : <Navigate to="/login" replace />} />
//     </Routes>
//   );
// };

// export default Index;
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./Dashboard";
import Users from "./Users";
import NotFound from "./NotFound";
import Rooms from "./Rooms";
import RoomDetail from "./RoomDetail";
import LoginPage from "./Login";
import { useApp } from "@/context/AppContext";

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
  const { role } = useApp();
  
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={role ? <AppRoutes /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
};

export default Index;