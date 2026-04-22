import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteEntity } from './note.entity';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([NoteEntity]), UsersModule],
  controllers: [NoteController],
  providers: [NoteService],
})
export class NotesModule {}
