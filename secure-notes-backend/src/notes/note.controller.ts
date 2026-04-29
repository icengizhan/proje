import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { NoteService, SharedNotePayload } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../users/user.entity';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('notes')
@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserNotes(@CurrentUser() user: UserEntity) {
    return this.noteService.getUserNotes(user);
  }

  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  async createNote(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateNoteDto,
  ) {
    return this.noteService.createNote(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateNote(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.noteService.updateNote(user, parseInt(id, 10), dto);
  }

  @Get('share/:slug')
  async getSharedNote(@Param('slug') slug: string): Promise<SharedNotePayload> {
    return this.noteService.getNoteBySlug(slug);
  }
}
