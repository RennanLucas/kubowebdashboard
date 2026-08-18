import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Folder } from "lucide-react";
import { useAllUserProjects } from "@/hooks/useAllUserProjects";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/contexts/OrganizationContext";

/**
 * Global project switcher in the topbar. Uses the shared `useSelectedProject`
 * hook so persistence + cross-component sync is centralized.
 */
export const GlobalProjectSwitcher = () => {
  const { data: projects, isLoading } = useAllUserProjects();
  const { selectedProjectId, setSelectedProjectId } = useSelectedProject();
  const { activeOrganization } = useOrganization();
  const [open, setOpen] = useState(false);

  // Pick a default if nothing stored yet, or if current project doesn't belong to org
  useEffect(() => {
    if (!projects) return;
    
    // Check if the currently selected project exists in the new organization's projects
    const isValidProject = projects.some(p => p.id === selectedProjectId);
    
    if ((!selectedProjectId || !isValidProject) && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    } else if (projects.length === 0 && selectedProjectId) {
      // Clear if org has no projects
      setSelectedProjectId(undefined);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  const handleSelect = (id: string) => {
    setSelectedProjectId(id);
    setOpen(false);
  };

  const activeId = selectedProjectId;
  const active = projects?.find((p) => p.id === activeId) ?? projects?.[0];

  if (!activeOrganization || isLoading || !projects || projects.length === 0) return null;

  // Only show if user has more than one project — single-project accounts
  // don't need a switcher cluttering the header.
  if (projects.length === 1) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-8 gap-2 px-2.5 text-[13px] font-normal max-w-[220px]"
        >
          <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate text-foreground">
            {active?.name ?? "Selecionar projeto"}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar projeto..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
            <CommandGroup>
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.organizationName} ${p.name}`}
                  onSelect={() => handleSelect(p.id)}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      activeId === p.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] truncate">{p.name}</span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {p.organizationName}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
