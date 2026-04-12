import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  dateRange: number;
  onDateRangeChange: (days: number) => void;
  clientName?: string;
  projectName?: string;
}

const DashboardHeader = ({ dateRange, onDateRangeChange, clientName, projectName }: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

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
        <p className="text-sm text-muted-foreground">
          {projectName ? `Projeto: ${projectName}` : `Bem-vindo, ${user?.email}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex bg-muted rounded-lg p-0.5">
          {[7, 30].map((d) => (
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
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
