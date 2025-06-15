
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./Dashboard";
import Faculty from "./Faculty";
import NotFound from "./NotFound";
import Rooms from "./Rooms";
import RoomDetail from "./RoomDetail";

const Index = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:roomId" element={<RoomDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default Index;
