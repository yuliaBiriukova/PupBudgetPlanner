# 0001. Tech stack

- Status: Accepted
- Date: 2026-10-27

## Context

The developer (project owner) knows C#, ASP.NET, SQL/NoSQL, HTML, CSS, React and Azure, and must be
able to review all code. The app must be responsive (mobile + desktop), free to host and well tested.

## Decision

- **Backend:** ASP.NET Core on .NET 10 (LTS), controllers, EF Core.
- **Database:** PostgreSQL (relational data: accounts, transactions, reports). EF Core makes it feel
  like SQL Server.
- **Frontend:** React + TypeScript + Vite as an SPA. Blazor was considered and rejected: heavier first
  load on mobile, smaller UI ecosystem.
- **UI library:** Mantine — free, mobile-friendly, includes charts, dates, forms and notifications.
  Considered: MUI (some parts paid), shadcn/ui (more hand assembly), Ant Design (desktop-first),
  Chakra UI and HeroUI (no charts).
- **Frontend libraries:** TanStack Query (server state), React Router, `@mantine/form` + zod (forms
  and validation, integrated with Mantine inputs), react-i18next, openapi-typescript (typed API).
- **Component workshop:** Storybook.

## Consequences

- Everything is in technologies the owner knows or that are close to them.
- PostgreSQL instead of SQL Server — small syntax differences, hidden behind EF Core.
