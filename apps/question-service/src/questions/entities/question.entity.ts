import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

export enum QuestionType {
  BEHAVIORAL = 'behavioral',
  TECHNICAL = 'technical',
  CODING = 'coding',
  SYSTEM_DESIGN = 'system_design',
  SITUATIONAL = 'situational',
  MCQ = 'mcq',
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Schema({ _id: false })
export class McqOption {
  @Prop({ required: true }) text: string;
  @Prop({ required: true }) isCorrect: boolean;
}

export const McqOptionSchema = SchemaFactory.createForClass(McqOption);

@Schema({
  timestamps: true,
  collection: 'questions',
  toJSON: {
    transform: (_, ret: Record<string, unknown>) => {
      ret.id = (ret._id as { toString(): string }).toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Question {
  _id: Types.ObjectId;

  @Prop({ required: true, index: true }) title: string;
  @Prop({ required: true }) content: string;
  @Prop() hints?: string;
  @Prop() sampleAnswer?: string;

  @Prop({ type: String, enum: QuestionType, required: true, index: true })
  type: QuestionType;

  @Prop({ type: String, enum: Difficulty, required: true, index: true })
  difficulty: Difficulty;

  @Prop({ required: true, index: true }) category: string;
  @Prop({ type: [String], default: [], index: true }) tags: string[];
  @Prop({ type: [McqOptionSchema], default: [] }) mcqOptions: McqOption[];
  @Prop({ default: 0 }) usageCount: number;
  @Prop({ default: true }) isActive: boolean;

  createdAt: Date;
  updatedAt: Date;

  get id(): string {
    return this._id.toString();
  }
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

QuestionSchema.index({ type: 1, difficulty: 1 });
QuestionSchema.index({ category: 1, tags: 1 });
QuestionSchema.index({ isActive: 1, usageCount: 1 });
