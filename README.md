# AI Driven Attendance Monitoring

Attend IT:

- `backend`: Express, Mongoose, MongoDB Atlas API.
- `frontend`: React/Vite web dashboard.
- `attend_it`: unified MongoDB database for web and mobile data.

## Common Commands

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build:web
npm.cmd run lint:web
```

Backend-only:

```powershell
cd backend
npm.cmd install
npm.cmd test
npm.cmd run dev
```

## Security Notes

Never commit `.env`, `node_modules/`, private model datasets, or database export
folders. Rotate Atlas credentials from MongoDB Atlas, then update `MONGO_URI`
in local and deployment environment variables.
