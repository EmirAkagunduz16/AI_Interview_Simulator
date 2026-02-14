// Module
export { KafkaModule } from './kafka.module';

// Services
export { KafkaProducerService } from './services/kafka-producer.service';
export { KafkaConsumerService } from './services/kafka-consumer.service';

// Interfaces
export {
  KafkaModuleOptions,
  KafkaModuleAsyncOptions,
  KafkaEventHandler,
  KafkaEventMetadata,
  KAFKA_MODULE_OPTIONS,
  KAFKA_EVENT_HANDLERS,
} from './interfaces/kafka.interfaces';
