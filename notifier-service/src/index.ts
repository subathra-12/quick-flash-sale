
import { AppDataSource } from '../shared/src/data-source';
import { kafka } from '../shared/src/kafka';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';

const wss = new WebSocket.Server({ port: 3004 });
const consumer = kafka.consumer({ groupId: 'notifier-group' });

const connections = new Map<number, WebSocket>(); // userId -> ws

wss.on('connection', (socket, req) => {
  // expect token as query param: ?token=...
  const params = new URLSearchParams(req.url?.split('?')[1]);
  const token = params.get('token');
  try {
    const payload: any = jwt.verify(token || '', process.env.JWT_SECRET || 'secret');
    const userId = payload.userId;
    connections.set(userId, socket);
    socket.on('close', () => connections.delete(userId));
  } catch (e) {
    socket.close();
  }
});

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order.status', fromBeginning: false });
  await consumer.run({ eachMessage: async ({ message }) => {
    if (!message.value) return;
    const data = JSON.parse(message.value.toString());
    const userId = data.userId;
    const conn = connections.get(userId);
    if (conn && conn.readyState === WebSocket.OPEN) {
      conn.send(JSON.stringify({ type: 'order.update', data }));
    }
  }});
}

AppDataSource.initialize().then(() => {
  startConsumer();
  console.log('Notifier service (ws) on 3004');
}).catch(e => console.error(e));
