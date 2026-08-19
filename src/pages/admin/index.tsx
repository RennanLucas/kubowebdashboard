import { Routes, Route, Navigate } from "react-router-dom";
import AdminUsers from "../Admin";
import { AdminFeedback } from "./AdminFeedback";
import { AdminRoadmap } from "./AdminRoadmap";

export default function AdminRouter() {
  return (
    <Routes>
      <Route path="/" element={<AdminUsers />} />
      <Route path="/feedback" element={<AdminFeedback />} />
      <Route path="/roadmap" element={<AdminRoadmap />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
