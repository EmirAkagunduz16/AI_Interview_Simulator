import { IsString, IsOptional, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;
}
