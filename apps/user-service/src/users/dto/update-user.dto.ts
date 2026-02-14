import { IsString, IsOptional, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "John Doe" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ example: "+90 532 123 4567" })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;
}
