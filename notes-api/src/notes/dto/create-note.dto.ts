import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(10_000)
  body: string;
}
