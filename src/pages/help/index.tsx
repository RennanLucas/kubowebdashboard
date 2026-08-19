import { Routes, Route } from "react-router-dom";
import { HelpCenter } from "./HelpCenter";
import { HelpArticle } from "./HelpArticle";

export default function HelpRouter() {
  return (
    <Routes>
      <Route path="/" element={<HelpCenter />} />
      <Route path="/:articleId" element={<HelpArticle />} />
    </Routes>
  );
}
