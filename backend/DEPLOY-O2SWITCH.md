# Deploying on O2switch

This backend is configured for [O2switch](https://www.o2switch.fr/) shared hosting via **Setup Node.js App** (Phusion Passenger).

## Prerequisites

- O2switch hosting with cPanel access
- A MySQL database created in cPanel (MySQL Databases)
- A subdomain or domain for the API (e.g. `api.yourdomain.com`)
- SSH access (recommended — cPanel Terminal has memory limits)

## 1. Create the MySQL database

In cPanel → **MySQL Databases**:

1. Create a database (e.g. `youruser_marketplace`)
2. Create a user and assign it to the database with **ALL PRIVILEGES**
3. Note the connection string:

```
mysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME
```

## 2. Upload the application

From your machine:

```bash
cd backend
npm run package:o2switch
```

Upload `deploy-o2switch.zip` to the server (e.g. via File Manager or SFTP) and extract it into a folder **outside** the domain document root, for example:

```
/home/youruser/marketplace-backend/
```

> O2switch recommends keeping application sources separate from the domain folder. When the app is stopped, files in the document root can be publicly accessible.

## 3. Create the Node.js app in cPanel

cPanel → **Logiciels** → **Setup Node.js App** → **Create Application**

| Setting | Value |
|---------|-------|
| Node.js version | **20** (or 22) |
| Application mode | **Production** |
| Application root | `/home/youruser/marketplace-backend` |
| Application URL | `api.yourdomain.com` (your API subdomain) |
| Application startup file | `server.js` |
| Passenger log file | `/home/youruser/logs/marketplace-api.log` (optional) |

Click **Create**.

## 4. Environment variables

In the same Setup Node.js App screen, add these variables (**Add Variable**):

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `API_BASE_URL` | `https://api.yourdomain.com` |
| `CORS_ORIGIN` | `https://yourdomain.com` |
| `DATABASE_URL` | `mysql://user:pass@localhost:3306/dbname` |
| `JWT_ACCESS_SECRET` | (min 32 random characters) |
| `JWT_REFRESH_SECRET` | (min 32 random characters) |
| `UPLOAD_DIR` | `uploads` |

Add YouTube variables if you use centralized video uploads.

Save and restart the app.

## 5. Install dependencies and run migrations (SSH)

Copy the `source` command shown in cPanel (Setup Node.js App → edit your app), then:

```bash
source /home/youruser/nodevenv/marketplace-backend/20/bin/activate
cd /home/youruser/marketplace-backend

npm install
npm run db:migrate:deploy
```

Optional — seed super admin (first deploy only):

```bash
npm run db:seed
```

Restart the app from cPanel (**Restart**).

## 6. Verify

```bash
curl https://api.yourdomain.com/api/health
```

Expected:

```json
{"success":true,"message":"OK","data":{"status":"healthy"}}
```

Point the React frontend at `REACT_APP_API_URL=https://api.yourdomain.com/api`.

## Troubleshooting

### App timeout (~90s) on start

Passenger waits for `server.listen()`. This project uses `server.js` at the application root with Passenger support. Ensure **Application startup file** is `server.js`, not `src/server.js`.

### Memory errors during `npm install`

Use a real SSH client (PuTTY, Terminal) instead of cPanel Terminal.

### Native module build errors (`bcrypt`, `node-gyp`)

Contact O2switch support to request compiler access, or ensure prebuilt binaries install correctly on Node 20.

### Debug Passenger errors

Add to the `.htaccess` in your domain folder (created by Setup Node.js App):

```apache
PassengerAppEnv development
PassengerFriendlyErrorPages on
PassengerAppLogFile "/home/youruser/logs/marketplace-api-error.log"
```

Also check cPanel → **Errors** and your Passenger log file.

### WebSockets (chat)

Socket.io runs on the same HTTP server. WebSocket support depends on Passenger/Apache configuration on shared hosting. If real-time chat fails, REST endpoints under `/api/chat` still work.

### Uploads

Files are stored in `uploads/` under the application root. Ensure the folder is writable:

```bash
mkdir -p uploads && chmod 755 uploads
```

## Updating

1. Upload changed files (or re-run `npm run package:o2switch`)
2. SSH: `npm install` if `package.json` changed
3. `npm run db:migrate:deploy` if there are new migrations
4. Restart the app in cPanel

## References

- [O2switch — Deploy Node.js app](https://faq.o2switch.fr/cpanel/logiciels/hebergement-nodejs-multi-version/)
- [O2switch — Node.js guides](https://faq.o2switch.fr/guides/nodejs/)
