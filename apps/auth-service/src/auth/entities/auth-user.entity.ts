import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type AuthUserDocument = AuthUser & Document;

@Schema({
  timestamps: true,
  collection: "auth_users",
  toJSON: {
    transform: (_: unknown, ret: Record<string, unknown>) => {
      ret.id = (ret._id as Types.ObjectId).toString();
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      delete ret.refreshToken;
      return ret;
    },
  },
})
export class AuthUser {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ trim: true })
  name?: string;

  @Prop({ default: "user" })
  role: string;

  @Prop()
  refreshToken?: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const AuthUserSchema = SchemaFactory.createForClass(AuthUser);

AuthUserSchema.index({ email: 1 }, { unique: true });
