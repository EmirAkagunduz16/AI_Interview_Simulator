import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
import { User, UserDocument } from "../entities/user.entity";

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByAuthId(authId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ authId }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async update(id: string, data: Partial<User>): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async updateByAuthId(
    authId: string,
    data: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate({ authId }, { $set: data }, { new: true })
      .exec();
  }

  async findAll(
    filter: FilterQuery<User> = {},
    options: PaginationOptions = {},
  ): Promise<{ users: UserDocument[]; total: number }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return { users, total };
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userModel
      .countDocuments({ email: email.toLowerCase() })
      .exec();
    return count > 0;
  }

  async deactivate(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { isActive: false }).exec();
  }
}
