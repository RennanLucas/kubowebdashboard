---
name: SaaS Shell Layout
description: AppLayout shell with refined sidebar (Linear-style), rich topbar (breadcrumbs + global project switcher + user menu) and shared PageHeader/PageContainer components.
type: design
---
- Tokens (`src/index.css`): radius `0.625rem`, shadow scale (`--shadow-xs/sm/md/lg`), `--gradient-surface`, `--gradient-sidebar`. `glass-card` uses `--shadow-sm`. Page typography utilities: `.page-title` (22px/600), `.page-subtitle`. Linear-like `.kbd` utility.
- `AppSidebar` (`src/components/layout/AppSidebar.tsx`): gradient background, `Principal` and `Conta` groups separated by divider, uppercase tracked group labels, 2px left active indicator, compact 13px nav items, footer with avatar + email + logout.
- `AppLayout` topbar (h-14): SidebarTrigger → divider → `<GlobalProjectSwitcher>` + `<Breadcrumbs>` → search button (kbd ⌘K) + alerts bell + divider + `<UserMenu>`.
- `<GlobalProjectSwitcher>` (`src/components/layout/GlobalProjectSwitcher.tsx`): combobox over `useAllUserProjects`, persists selection in `dashboard:last-project-id` localStorage key (same key Dashboard reads), dispatches `project-changed` CustomEvent. Hidden when user has ≤1 project.
- `<Breadcrumbs>` (`src/components/layout/Breadcrumbs.tsx`): derives crumbs from `useLocation().pathname` segments + `ROUTE_LABELS` map.
- `<UserMenu>`: avatar dropdown with email, role badge, links to Settings/Subscription/Admin, sign-out.
- `PageHeader` + `PageContainer` (`src/components/layout/PageHeader.tsx`): reusable page top wrapper. Use for new pages or when refactoring existing ones.
- Dashboard hydrates `selectedProjectId` from localStorage on mount and listens to the `project-changed` event so the topbar switcher updates it without reload.
