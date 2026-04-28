import { IsString, IsNotEmpty, IsInt, IsNumber, Min, Max } from 'class-validator';

export class UpdateProgressDto {
  @IsString()
  @IsNotEmpty()
  filmSlug: string;

  @IsInt({ message: 'episodeNumber phải là số nguyên' })
  @Min(1)
  episodeNumber: number;

  @IsNumber({}, { message: 'progress phải là số thực' })
  @Min(0)
  @Max(1)
  progress: number;
}
