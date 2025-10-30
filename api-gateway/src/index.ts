
import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import fetch from 'node-fetch';

const app = express();
app.use(bodyParser.json());
const redis = new Redis({ host: process.env.REDIS_HOST || 'redis' });

// simple rate limit: max 10 requests per minute per user/ip
app.use(async (req, res, next) => {
  const key = req.header('Authorization') || req.ip;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }
  if (count > 100) return res.status(429).send('rate limit');
  next();
});

app.use((req, res, next) => {
  if (req.path.startsWith('/public')) return next();
  const auth = req.header('Authorization')?.split(' ')[1];
  try {
    const payload: any = jwt.verify(auth || '', process.env.JWT_SECRET || 'secret');
    (req as any).user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'unauthorized' });
  }
});

// proxy example - forward /orders to order-service
app.use('/orders', async (req, res) => {
  const url = 'http://order-service:3003' + req.originalUrl;
  const method = req.method;
  const body = req.body && JSON.stringify(req.body);
  const headers = { 'Content-Type': 'application/json' };
  const downstream = await fetch(url, { method, body, headers });
  const text = await downstream.text();
  res.status(downstream.status).send(text);
});

app.listen(3000, () => console.log('API Gateway on 3000'));
