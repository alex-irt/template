import express from 'express';
import cookieParser from 'cookie-parser';
import auth from './api/auth-middleware.mjs';
import apiUsers from './api/users.mjs';
import runMigrations from './db/migrations.mjs';

runMigrations();

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '20mb' }));
app.use(express.static('static'));
app.use(cookieParser());
app.use(auth);

apiUsers(app);

app.listen(3000);
