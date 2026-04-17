import { Button } from "@/components/ui/button";
import { LogOut, Settings, ChevronDown, FileDown, BarChart3, Shield, FileText, FileSpreadsheet, FileType } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  url: string | null;
}

interface DashboardHeaderProps {
  dateRange: number;
  onDateRangeChange: (days: number) => void;
  clientName?: string;
  projectName?: string;
  projects?: Project[];
  selectedProjectId?: string;
  onProjectChange?: (projectId: string) => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
}

const DashboardHeader = ({
  dateRange,
  onDateRangeChange,
  clientName,
  projectName,
  projects,
  selectedProjectId,
  onProjectChange,
  onExportPDF,
}: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const hasMultipleProjects = projects && projects.length > 1;

  return (
    <header className="glass-card p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-medium text-foreground tracking-tight">
                {clientName || "Dashboard"}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wider">
                Analytics
              </span>
            </div>
            {hasMultipleProjects ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mt-0.5">
                    {projectName || "Selecionar projeto"}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {projects.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => onProjectChange?.(p.id)}
                      className={p.id === selectedProjectId ? "bg-accent" : ""}
                    >
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">
                {projectName || `Bem-vindo, ${user?.email}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-0.5">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => onDateRangeChange(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                  dateRange === d
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-border" />
          {onExportPDF && (
            <Button variant="outline" size="sm" onClick={onExportPDF} className="gap-1.5 text-xs transition-all duration-150">
              <FileDown className="h-3.5 w-3.5" />
              Exportar
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="text-muted-foreground h-8 w-8 transition-colors duration-150 hover:text-foreground" title="Admin">
              <Shield className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-muted-foreground h-8 w-8 transition-colors duration-150 hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground h-8 w-8 transition-colors duration-150 hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
