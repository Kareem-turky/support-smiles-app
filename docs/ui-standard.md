# UI Standardization Guidelines

This document outlines the UI standards for the Support Smiles application to ensure consistency across all modules.

## 1. Page Layout
All pages must use the `AppLayout` wrapper.
Inside `AppLayout`, the content should be structured as follows:
- **Spacing**: `space-y-6` container for vertical rhythm.
- **Padding**: `p-6` (handled by AppLayout).

## 2. Shared Components
Use the following components from `src/components/shared/`:

### PageHeader
- **Usage**: Top of every page.
- **Props**:
  - `title`: Page title (H1).
  - `description`: Optional subtitle/context.
  - `actions`: Optional ReactNode for buttons (e.g., "Create Ticket").

### FiltersBar
- **Usage**: Below header, above data table.
- **Features**:
  - Search input (optional).
  - Date Range Picker (optional).
  - Custom filters (slots).
  - Reset button.
- **Style**: Flex container, gap-4, items-center.

### KPICards
- **Usage**: For dashboards or summary pages.
- **Props**:
  - `cards`: Array of `{ title, value, icon, description, change? }`.
- **Style**: Grid layout (1-4 columns).

### DataTable
- **Usage**: Main data display.
- **Features**:
  - Loading state (Skeleton).
  - Empty state (Illustration + Message).
  - Error state.
  - Pagination (if applicable).
  - Standardized styling for headers and cells.

## 3. Design Tokens
- **Colors**: Use Tailwind semantic classes (`text-primary`, `text-muted-foreground`, `bg-background`).
- **Typography**:
  - H1: `text-3xl font-bold tracking-tight`.
  - H2: `text-xl font-semibold`.
  - Body: `text-sm`.
  - Muted: `text-sm text-muted-foreground`.
- **Cards**:
  - Padding: `p-6` (default CardContent).
  - Gap: `gap-4` for grids.

## 4. Implementation Checklist
- [ ] Import `PageHeader`.
- [ ] Import `FiltersBar` (if needed).
- [ ] Import `KPICards` (if needed).
- [ ] Wrap table in `DataTable` or `ContentCard`.
- [ ] Remove custom/inline styles in favor of these components.
