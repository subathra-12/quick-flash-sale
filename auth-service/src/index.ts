
import express from 'express';
import bodyParser from 'body-parser';
import { AppDataSource } from '../shared/src/data-source';
import { User } from './entity/User';
import jwt from 'jsonwebtoken';

const app = express();
app.use(bodyParser.json());

app.post('/register', async (req, res) => {
  const repo = AppDataSource.getRepository(User);
  const user = repo.create(req.body);
  await repo.save(user);
  res.json({ id: user.id });
});

app.post('/login', async (req, res) => {
  const { email } = req.body;
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ email });
  if (!user) return res.status(401).json({ error: 'invalid' });
  const access = jwt.sign({ userId: user.id }, process.env.JWT_SECRET , { expiresIn: '15m' });
  const refresh = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET , { expiresIn: '1d' });
  res.json({ accessToken: access, refreshToken: refresh });
});

AppDataSource.initialize().then(() => {
  app.listen(3001, () => console.log('Auth service on 3001'));
}).catch(e => console.error(e));
