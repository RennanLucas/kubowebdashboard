import { Button } from "@/components/ui/button";
import { ChevronDown, FileDown, BarChart3, FileText, FileSpreadsheet, FileType, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from "./DateRangePicker";

interface Project {
  id: string;
  name: string;
  url: string | null;
  clientName?: string;
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

const formatHost = (url?: string | null) => {
  if (!url) return null;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
};

const DashboardHeader = ({
  dateRange,
  onDateRangeChange,
  clientName,
  projectName,
  projects,
  selectedProjectId,
  onProjectChange,
  onExportPDF,
  onExportCSV,
  onExportExcel,
}: DashboardHeaderProps) => {
  const { user } = useAuth();

  const hasMultipleProjects = projects && projects.length > 1;

  return (
    <header className="glass-card p-5 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight truncate">
                {clientName || "Dashboard"}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider">
                Analytics
              </span>
            </div>
            {hasMultipleProjects ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mt-0.5 group">
                    <span className="truncate max-w-[260px]">
                      {projectName || "Selecionar projeto"}
                    </span>
                    <ChevronDown className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[320px] max-h-[400px] overflow-y-auto">
                  {projects.map((p) => {
                    const host = formatHost(p.url);
                    const isActive = p.id === selectedProjectId;
                    return (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => onProjectChange?.(p.id)}
                        className={`flex flex-col items-start gap-0.5 py-2 ${isActive ? "bg-accent" : ""}`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-medium text-sm truncate flex-1">{p.name}</span>
                          {p.clientName && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider shrink-0">
                              {p.clientName}
                            </span>
                          )}
                        </div>
                        {host && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            <span className="truncate">{host}</span>
                          </div>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {projectName || `Bem-vindo, ${user?.email}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
          
          {(onExportPDF || onExportCSV || onExportExcel) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm hover:shadow transition-all duration-150">
                  <FileDown className="h-3.5 w-3.5" />
                  Exportar
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onExportPDF && (
                  <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer">
                    <FileType className="h-4 w-4 text-muted-foreground" />
                    PDF
                  </DropdownMenuItem>
                )}
                {onExportExcel && (
                  <DropdownMenuItem onClick={onExportExcel} className="gap-2 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    Excel (.xlsx)
                  </DropdownMenuItem>
                )}
                {onExportCSV && (
                  <DropdownMenuItem onClick={onExportCSV} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    CSV
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};
export default DashboardHeader;
