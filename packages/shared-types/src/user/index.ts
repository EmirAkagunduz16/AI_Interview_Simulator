// ===========================
// User Types
// ===========================

export interface IUser {
  _id: string;
  email: string;
  name?: string;
  role: UserRole;
  profile: IUserProfile;
  subscription: ISubscription;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  avatar?: string;
  bio?: string;
  targetRole?: string;
  experienceLevel?: ExperienceLevel;
  skills?: string[];
}

export interface ISubscription {
  plan: SubscriptionPlan;
  expiresAt?: Date;
  interviewsUsed: number;
  interviewsLimit: number;
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  PREMIUM = "premium",
}

export enum ExperienceLevel {
  JUNIOR = "junior",
  MID = "mid",
  SENIOR = "senior",
}

export enum SubscriptionPlan {
  FREE = "free",
  BASIC = "basic",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}
