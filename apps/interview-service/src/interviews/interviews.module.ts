import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { Interview, InterviewSchema } from './entities/interview.entity';
import { InterviewRepository } from './repositories/interview.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Interview.name, schema: InterviewSchema }]),
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService, InterviewRepository],
  exports: [InterviewsService],
})
export class InterviewsModule {}
