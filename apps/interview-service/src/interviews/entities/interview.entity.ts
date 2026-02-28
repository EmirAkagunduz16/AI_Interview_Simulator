import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { InterviewStatus, InterviewType } from "@ai-coach/shared-types";

export type InterviewDocument = Interview & Document;

// Re-export for convenience (so existing imports from this file still work)
export { InterviewStatus, InterviewType };

@Schema({ _id: false })
export class InterviewAnswer {
  @Prop({ required: true }) questionId: string;
  @Prop({ required: true }) questionTitle: string;
  @Prop({ required: true }) answer: string;
  @Prop() feedback?: string;
  @Prop() score?: number;
  @Prop({ type: [String], default: [] }) strengths: string[];
  @Prop({ type: [String], default: [] }) improvements: string[];
  @Prop({ default: Date.now }) answeredAt: Date;
  @Prop() evaluatedAt?: Date;
}

export const InterviewAnswerSchema =
  SchemaFactory.createForClass(InterviewAnswer);

@Schema({ _id: false })
export class InterviewMessage {
  @Prop({ required: true, enum: ["user", "agent"] }) role: string;
  @Prop({ required: true }) content: string;
  @Prop({ default: Date.now }) createdAt: Date;
}

export const InterviewMessageSchema =
  SchemaFactory.createForClass(InterviewMessage);

@Schema({ _id: false })
export class InterviewReport {
  @Prop({ default: 0 }) technicalScore: number;
  @Prop({ default: 0 }) communicationScore: number;
  @Prop({ default: 0 }) dictionScore: number;
  @Prop({ default: 0 }) confidenceScore: number;
  @Prop({ default: 0 }) overallScore: number;
  @Prop() summary?: string;
  @Prop({ type: [String], default: [] }) recommendations: string[];
}

export const InterviewReportSchema =
  SchemaFactory.createForClass(InterviewReport);

@Schema({
  timestamps: true,
  collection: "interviews",
  toJSON: {
    transform: (_, ret: Record<string, unknown>) => {
      ret.id = (ret._id as { toString(): string }).toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Interview {
  _id: Types.ObjectId;

  @Prop({ required: true, index: true }) userId: string;
  @Prop() title?: string;

  // Interview configuration
  @Prop({ required: true }) field: string;
  @Prop({ type: [String], default: [] }) techStack: string[];

  @Prop({ type: String, enum: InterviewType, default: InterviewType.MIXED })
  type: InterviewType;

  @Prop({
    type: String,
    enum: InterviewStatus,
    default: InterviewStatus.PENDING,
    index: true,
  })
  status: InterviewStatus;

  @Prop({ default: "intermediate" }) difficulty: string;
  @Prop() vapiCallId?: string;

  @Prop({ type: [String], default: [] }) questionIds: string[];
  @Prop({ type: [InterviewAnswerSchema], default: [] })
  answers: InterviewAnswer[];

  @Prop({ type: [InterviewMessageSchema], default: [] })
  messages: InterviewMessage[];

  // Report
  @Prop({ type: InterviewReportSchema }) report?: InterviewReport;

  @Prop() targetRole?: string;
  @Prop({ default: 30 }) durationMinutes: number;
  @Prop() totalScore?: number;
  @Prop() overallFeedback?: string;

  @Prop() startedAt?: Date;
  @Prop() completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  get id(): string {
    return this._id.toString();
  }
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);

InterviewSchema.index({ userId: 1, status: 1 });
InterviewSchema.index({ createdAt: -1 });
InterviewSchema.index({ vapiCallId: 1 });
