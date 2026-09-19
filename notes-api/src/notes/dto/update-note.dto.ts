import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  body?: string;
}
