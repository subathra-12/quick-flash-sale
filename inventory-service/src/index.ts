
import express from 'express';
import bodyParser from 'body-parser';
import { AppDataSource } from '../shared/src/data-source';
import { Product } from './entity/Product';
import { kafka } from '../shared/src/kafka';

const app = express();
app.use(bodyParser.json());

const producer = kafka.producer();

app.post('/reserve', async (req, res) => {
  // simple pessimistic reservation example
  const { productId, quantity, orderId } = req.body;
  const repo = AppDataSource.getRepository(Product);
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const product = await queryRunner.manager.findOne(Product, { where: { id: productId } , lock: { mode: 'pessimistic_write' } });
    if (!product || product.stock < quantity) {
      await queryRunner.rollbackTransaction();
      // emit inventory.result (failed)
      await producer.connect();
      await producer.send({ topic: 'inventory.result', messages: [{ key: String(orderId), value: JSON.stringify({ orderId, success: false }) }] });
      return res.status(400).json({ success: false });
    }
    product.stock -= quantity;
    await queryRunner.manager.save(product);
    await queryRunner.commitTransaction();
    // emit inventory.result (success)
    await producer.connect();
    await producer.send({ topic: 'inventory.result', messages: [{ key: String(orderId), value: JSON.stringify({ orderId, success: true }) }] });
    res.json({ success: true });
  } catch (err) {
    await queryRunner.rollbackTransaction();
    res.status(500).json({ error: err.message });
  } finally {
    await queryRunner.release();
  }
});

AppDataSource.initialize().then(() => {
  app.listen(3002, () => console.log('Inventory service on 3002'));
}).catch(e => console.error(e));
