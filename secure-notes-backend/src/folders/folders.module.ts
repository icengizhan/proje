import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { FolderEntity } from './folder.entity';
import { NoteEntity } from '../notes/note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FolderEntity, NoteEntity])],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
