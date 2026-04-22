import { IsString, IsNotEmpty, MaxLength, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  content: string;

  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @IsOptional()
  @IsNumber()
  folderId?: number;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsString()
  paperType?: string;

  @IsOptional()
  @IsString()
  paperColor?: string;
}
