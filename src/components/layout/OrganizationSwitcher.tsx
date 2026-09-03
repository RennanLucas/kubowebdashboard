import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
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

export const OrganizationSwitcher = () => {
  const { activeOrganization, organizations, setOrganization, loading } = useOrganization();
  const [open, setOpen] = useState(false);

  const handleSelect = (id: string) => {
    setOrganization(id);
    setOpen(false);
  };

  if (loading || !organizations || organizations.length === 0) return null;

  // Render nothing if user has no orgs
  if (organizations.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-tour="organization-switcher"
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          data-testid="org-switcher"
          className="h-8 gap-2 px-2.5 text-[13px] font-normal w-full justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate text-foreground">
              {activeOrganization?.name ?? "Selecionar Organização"}
            </span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar organização..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhuma organização encontrada.</CommandEmpty>
            <CommandGroup>
              {organizations.map((membership) => {
                const org = membership.organization;
                return (
                  <CommandItem
                    key={org.id}
                    value={org.name}
                    data-testid="org-item"
                    onSelect={() => handleSelect(org.id)}
                    className="gap-2"
                  >
                    <Check
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        activeOrganization?.id === org.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[13px] truncate">{org.name}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
