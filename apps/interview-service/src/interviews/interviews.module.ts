import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GrpcInterviewsController } from "./grpc.controller";
import { InterviewsService } from "./interviews.service";
import { Interview, InterviewSchema } from "./entities/interview.entity";
import { InterviewRepository } from "./repositories/interview.repository";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interview.name, schema: InterviewSchema },
    ]),
  ],
  controllers: [GrpcInterviewsController],
  providers: [InterviewsService, InterviewRepository],
  exports: [InterviewsService],
})
export class InterviewsModule {}
