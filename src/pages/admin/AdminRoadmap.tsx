import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoadmapBoard } from "@/components/admin/RoadmapBoard";

export function AdminRoadmap() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin Roadmap — KUBOWEB</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link>
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-border mb-6">
          <Link to="/admin" className="pb-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium">Usuários</Link>
          <Link to="/admin/feedback" className="pb-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium">Feedback & Melhorias</Link>
          <Link to="/admin/roadmap" className="pb-2 border-b-2 border-primary text-foreground font-medium">Roadmap</Link>
        </div>

        <RoadmapBoard />
      </div>
    </div>
  );
}
