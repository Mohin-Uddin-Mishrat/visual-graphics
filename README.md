# Visual Graphics Backend

NestJS backend with Prisma, PostgreSQL, Cloudflare R2, JWT auth, and SMTP mail support.

## Local development

```bash
npm install
npm run db:generate
npm run start:dev
```

The API runs with the global prefix `api/v1`.

## Production deployment on a DigitalOcean droplet

This project is prepared to run on a droplet that already hosts another backend.

### What is configured for that case

- The API container stays private on `127.0.0.1:${API_PORT}` instead of exposing itself publicly.
- PostgreSQL also stays private on `127.0.0.1:${DB_PORT}`.
- Nginx can forward a subdomain like `api.visual-graphics.yourdomain.com` to this backend.
- Prisma migrations run automatically when the API container starts.

### 1. Copy the project to the server

```bash
git clone <your-repo-url> visual-graphics
cd visual-graphics
cp .env.example .env
```

### 2. Edit the production environment

Set strong values in `.env` for:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `DATABASE_URL`
- `CORS_ORIGINS`
- `FRONTEND_LOGIN_URL`
- `R2_*`
- `SMTP_*`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_FULL_NAME`

Recommended port values when another backend already exists on the same droplet:

```env
API_PORT=3001
DB_PORT=5435
CONTAINER_PORT=3000
```

### 3. Build and start with Docker Compose

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
docker compose logs -f api
```

### 4. Add Nginx reverse proxy

Example config is in `deploy/nginx.visual-graphics.conf`.

Typical Ubuntu steps:

```bash
sudo cp deploy/nginx.visual-graphics.conf /etc/nginx/sites-available/visual-graphics
sudo ln -s /etc/nginx/sites-available/visual-graphics /etc/nginx/sites-enabled/visual-graphics
sudo nginx -t
sudo systemctl reload nginx
```

Update the file first:

- Replace `api.visual-graphics.yourdomain.com` with your real subdomain.
- Keep `proxy_pass http://127.0.0.1:3001;` unless you change `API_PORT`.

### 5. Enable HTTPS

If Certbot is installed:

```bash
sudo certbot --nginx -d api.visual-graphics.yourdomain.com
```

## Useful commands

```bash
docker compose up -d --build
docker compose down
docker compose logs -f api
docker compose logs -f db
docker compose exec api npm run db:deploy
```

## Notes

- If your droplet already has Nginx serving another backend, that is fine. Add a separate `server_name` block for this project.
- If you already have a managed PostgreSQL database, you can remove the `db` service from `compose.yaml` and point `DATABASE_URL` to that external database.
- Swagger is enabled by the application bootstrap and will be available through the same domain.
