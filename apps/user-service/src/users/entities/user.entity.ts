import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: "users",
  toJSON: {
    transform: (_: unknown, ret: Record<string, unknown>) => {
      ret.id = (ret._id as { toString(): string }).toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  authId: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ trim: true }) name?: string;
  @Prop() phone?: string;
  @Prop({ default: true }) isActive: boolean;

  // Dashboard stats
  @Prop({ default: 0 }) interviewCount: number;
  @Prop({ default: 0 }) totalScore: number;
  @Prop() lastInterviewAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  get id(): string {
    return this._id.toString();
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ authId: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });
