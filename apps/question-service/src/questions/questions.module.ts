import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GrpcQuestionsController } from "./grpc.controller";
import { QuestionsService } from "./questions.service";
import { Question, QuestionSchema } from "./entities/question.entity";
import { QuestionRepository } from "./repositories/question.repository";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [GrpcQuestionsController],
  providers: [QuestionsService, QuestionRepository],
  exports: [QuestionsService],
})
export class QuestionsModule {}
