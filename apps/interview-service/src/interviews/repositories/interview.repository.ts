import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Interview, InterviewDocument, InterviewStatus, InterviewAnswer } from '../entities/interview.entity';

@Injectable()
export class InterviewRepository {
  private readonly logger = new Logger(InterviewRepository.name);

  constructor(
    @InjectModel(Interview.name)
    private readonly interviewModel: Model<InterviewDocument>,
  ) {}

  async create(data: Partial<Interview>): Promise<InterviewDocument> {
    const interview = new this.interviewModel(data);
    return interview.save();
  }

  async findById(id: string): Promise<InterviewDocument | null> {
    return this.interviewModel.findById(id).exec();
  }

  async findByUserIdAndId(userId: string, id: string): Promise<InterviewDocument | null> {
    return this.interviewModel.findOne({ _id: id, userId }).exec();
  }

  async findByUserId(
    userId: string,
    options: { page?: number; limit?: number; status?: InterviewStatus } = {},
  ): Promise<{ interviews: InterviewDocument[]; total: number }> {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Interview> = { userId };
    if (status) filter.status = status;

    const [interviews, total] = await Promise.all([
      this.interviewModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.interviewModel.countDocuments(filter).exec(),
    ]);

    return { interviews, total };
  }

  async updateStatus(id: string, status: InterviewStatus): Promise<InterviewDocument | null> {
    const updateData: Partial<Interview> = { status };
    if (status === InterviewStatus.IN_PROGRESS) {
      updateData.startedAt = new Date();
    } else if (status === InterviewStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }
    return this.interviewModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
  }

  async addAnswer(id: string, answer: InterviewAnswer): Promise<InterviewDocument | null> {
    return this.interviewModel
      .findByIdAndUpdate(id, { $push: { answers: answer } }, { new: true })
      .exec();
  }

  async updateAnswer(
    id: string,
    questionId: string,
    updateData: Partial<InterviewAnswer>,
  ): Promise<InterviewDocument | null> {
    return this.interviewModel
      .findOneAndUpdate(
        { _id: id, 'answers.questionId': questionId },
        { $set: { 'answers.$': { ...updateData, questionId } } },
        { new: true },
      )
      .exec();
  }

  async setCompletion(
    id: string,
    totalScore: number,
    overallFeedback: string,
  ): Promise<InterviewDocument | null> {
    return this.interviewModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: InterviewStatus.COMPLETED,
            totalScore,
            overallFeedback,
            completedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();
  }

  async getStats(userId: string): Promise<{
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    totalQuestionsAnswered: number;
  }> {
    const [total, completed, scoreData] = await Promise.all([
      this.interviewModel.countDocuments({ userId }),
      this.interviewModel.countDocuments({ userId, status: InterviewStatus.COMPLETED }),
      this.interviewModel.aggregate([
        { $match: { userId, status: InterviewStatus.COMPLETED, totalScore: { $exists: true } } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$totalScore' },
            totalQuestions: { $sum: { $size: '$answers' } },
          },
        },
      ]),
    ]);

    return {
      totalInterviews: total,
      completedInterviews: completed,
      averageScore: scoreData[0]?.avgScore || 0,
      totalQuestionsAnswered: scoreData[0]?.totalQuestions || 0,
    };
  }
}
