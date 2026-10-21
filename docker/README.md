# Run the whole Patana stack in Docker

From the repository root:

```bash
cp .env.docker.example .env
# Edit .env with unique secrets. Generate: openssl rand -hex 32
docker compose up --build -d
docker compose ps
docker compose logs -f api
```

Customer portal: http://localhost:8080  
Owner portal: http://localhost:8081  
API health (through either portal): http://localhost:8080/api/health

Services: `db` (persistent PostgreSQL), `db-init` (one-shot Prisma schema initialization), `api` (NestJS), `customer` and `owner` (Nginx web apps). The database and API aren't exposed as host ports. Nginx proxies `/api/` to the API.

```bash
docker compose down                 # stops containers, preserves database
docker compose up --build -d       # rebuild and restart
docker compose logs -f db-init api # troubleshoot
docker compose exec db psql -U patana -d patana
```

**Warning:** `db-init` uses Prisma `db push` for first-run convenience. It is suitable for local/dev or disposable staging environments, **not production schema lifecycle management**. Before real deployment, create reviewed migrations and replace `db push` with `prisma migrate deploy`. Back up the database and test restore. Never run `docker compose down -v` on a database you need to keep.

Use URL-safe secrets for `POSTGRES_PASSWORD` or percent-encode special characters in `DATABASE_URL`. Place HTTPS/TLS in a reverse proxy for internet exposure. Set origins to your actual HTTPS URLs. This stack is not yet authorized to accept live payments.
