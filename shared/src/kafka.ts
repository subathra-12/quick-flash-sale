
import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  clientId:  'quicksale-client',
  brokers:  'kafka:9092'
});
