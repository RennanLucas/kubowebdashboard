import { Button } from "@/components/ui/button";
import { ChevronDown, FileDown, BarChart3, FileText, FileSpreadsheet, FileType } from "lucide-react";
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
  onExportCSV,
  onExportExcel,
}: DashboardHeaderProps) => {
  const { user } = useAuth();

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
        <div className="flex items-center gap-2">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
          {(onExportPDF || onExportCSV || onExportExcel) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 transition-all duration-150">
                  <FileDown className="h-3.5 w-3.5" />
                  Exportar
                  <ChevronDown className="h-3 w-3" />
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
