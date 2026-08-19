import { Routes, Route } from "react-router-dom";
import { FeedbackPortal } from "./feedback/FeedbackPortal";

export default function FeedbackRouter() {
  return (
    <Routes>
      <Route path="/" element={<FeedbackPortal />} />
    </Routes>
  );
}
