import { IsString, IsEmail, IsOptional, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export class CreateUserInternalDto {
  @IsString()
  authId: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;
}
