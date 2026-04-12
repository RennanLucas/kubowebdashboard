import { Button } from "@/components/ui/button";
import { LogOut, Settings, ChevronDown, FileDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const hasMultipleProjects = projects && projects.length > 1;

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-foreground">KUBOWEB</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Portal</span>
        </div>
        {clientName && (
          <p className="text-sm font-medium text-foreground">{clientName}</p>
        )}
        {hasMultipleProjects ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Projeto: {projectName || "Selecionar"}
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
          <p className="text-sm text-muted-foreground">
            {projectName ? `Projeto: ${projectName}` : `Bem-vindo, ${user?.email}`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex bg-muted rounded-lg p-0.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => onDateRangeChange(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                dateRange === d
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        {onExportPDF && (
          <Button variant="ghost" size="icon" onClick={onExportPDF} className="text-muted-foreground" title="Exportar PDF">
            <FileDown className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-muted-foreground">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
