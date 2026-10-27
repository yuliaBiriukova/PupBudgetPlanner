# One image for Render: the React build is served by ASP.NET Core from wwwroot, the API under /api.
# See docs/decisions/0002-hosting-render-neon.md and docs/decisions/0010-docker-image.md.

# ---- 1. Frontend: React build ----
# Debian-based (not Alpine), so the native build tools pick their glibc binaries. Major version from frontend/.nvmrc.
FROM node:24-slim AS frontend
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- 2. Backend: publish the API ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend
WORKDIR /src/backend
# Project files first, so the restore layer is cached until a dependency changes.
COPY backend/global.json backend/Directory.Build.props backend/Directory.Packages.props ./
COPY backend/src/PupBudgetPlanner.Domain/PupBudgetPlanner.Domain.csproj src/PupBudgetPlanner.Domain/
COPY backend/src/PupBudgetPlanner.Application/PupBudgetPlanner.Application.csproj src/PupBudgetPlanner.Application/
COPY backend/src/PupBudgetPlanner.Infrastructure/PupBudgetPlanner.Infrastructure.csproj src/PupBudgetPlanner.Infrastructure/
COPY backend/src/PupBudgetPlanner.Api/PupBudgetPlanner.Api.csproj src/PupBudgetPlanner.Api/
# ReadyToRun: precompiled code makes the start after a sleep faster. Restore needs the flag too (crossgen package).
RUN dotnet restore src/PupBudgetPlanner.Api --runtime linux-x64 -p:PublishReadyToRun=true
COPY backend/src/ src/
RUN dotnet publish src/PupBudgetPlanner.Api --no-restore --configuration Release --runtime linux-x64 \
    --self-contained false -p:PublishReadyToRun=true --output /app

# ---- 3. Runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
# Workstation GC: less memory on the 512 MB free instance; the app has little traffic.
ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_gcServer=0
COPY --from=backend /app ./
COPY --from=frontend /src/frontend/dist ./wwwroot
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "PupBudgetPlanner.Api.dll"]
