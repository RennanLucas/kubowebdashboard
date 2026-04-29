import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Folder } from "lucide-react";
import { useAllUserProjects } from "@/hooks/useAllUserProjects";
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

const STORAGE_KEY = "dashboard:last-project-id";

/**
 * Global project switcher in the topbar.
 *
 * Reads/writes the same `dashboard:last-project-id` localStorage key
 * the Dashboard already uses, so changing it from the topbar updates
 * the project everywhere on next read. We also dispatch a `storage`-like
 * custom event so any open dashboard can react instantly.
 */
export const GlobalProjectSwitcher = () => {
  const { data: projects, isLoading } = useAllUserProjects();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  // Pick a default if nothing stored yet.
  useEffect(() => {
    if (!activeId && projects && projects.length > 0) {
      const first = projects[0].id;
      setActiveId(first);
      window.localStorage.setItem(STORAGE_KEY, first);
    }
  }, [projects, activeId]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    window.localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent("project-changed", { detail: { id } }));
    setOpen(false);
  };

  const active = projects?.find((p) => p.id === activeId) ?? projects?.[0];

  if (isLoading || !projects || projects.length === 0) return null;

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
                  value={`${p.clientName} ${p.name}`}
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
                      {p.clientName}
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
