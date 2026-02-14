import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { Question, QuestionSchema } from './entities/question.entity';
import { QuestionRepository } from './repositories/question.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }]),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionRepository],
  exports: [QuestionsService],
})
export class QuestionsModule {}
