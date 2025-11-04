const express = require('express');
const bodyParser = require('body-parser');
const { Kafka } = require('kafkajs');
const mysql = require('mysql2/promise');

const app = express();
app.use(bodyParser.json());

// Kafka setup
const kafka = new Kafka({
  clientId: 'order-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});
const producer = kafka.producer();

// MySQL setup
let pool;
(async () => {
  pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'rootpassword',
    database: process.env.DB_NAME || 'quicksale',
    waitForConnections: true,
    connectionLimit: 10
  });
})();

app.post('/orders', async (req, res) => {
  const idempotencyKey = req.header('Idempotency-Key');
  if (!idempotencyKey) return res.status(400).json({ error: 'Idempotency-Key required' });

  const { userId, productId, quantity } = req.body;
  if (!userId || !productId || !quantity)
    return res.status(400).json({ error: 'Missing fields' });

  const conn = await pool.getConnection();
  try {
    // Check existing order
    const [existing] = await conn.query('SELECT * FROM orders WHERE idempotencyKey = ?', [idempotencyKey]);
    if (existing.length > 0) {
      return res.json(existing[0]);
    }

    await conn.beginTransaction();

    // Insert new order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (userId, productId, quantity, status, idempotencyKey, createdAt) VALUES (userId, productId, quantity, 'PENDING', idempotencyKey]
    );
    const orderId = orderResult.insertId;

    // Insert Outbox entry
    await conn.query(
      'INSERT INTO outbox (aggregateType, aggregateId, type, payload, dispatched, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
      ['order', String(orderId), 'order.created', JSON.stringify({ orderId }), false]
    );

    await conn.commit();

    // Dispatch event
    await producer.connect();
    await producer.send({
      topic: 'order.created',
      messages: [{ key: String(orderId), value: JSON.stringify({ orderId, productId, quantity }) }]
    });

    // Mark outbox as dispatched
    await conn.query('UPDATE outbox SET dispatched = ? WHERE aggregateId = ?', [true, orderId]);

    res.json({ id: orderId, userId, productId, quantity, status: 'PENDING' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.listen(3003, () => console.log('Order service running on port 3003'));
