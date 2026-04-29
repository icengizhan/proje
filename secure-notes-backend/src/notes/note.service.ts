import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import sanitizeHtml from 'sanitize-html';
import { v4 as uuidv4 } from 'uuid';
import { NoteEntity } from './note.entity';
import { UserEntity } from '../users/user.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

export interface SharedNotePayload {
  title: string;
  content: string;
  created_at: Date;
  public_slug: string;
}

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(NoteEntity)
    private readonly noteRepository: Repository<NoteEntity>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getUserNotes(user: UserEntity): Promise<NoteEntity[]> {
    return this.noteRepository.find({
      where: { user: { id: user.id } },
      order: { updated_at: 'DESC' },
    });
  }

  async createNote(user: UserEntity, dto: CreateNoteDto): Promise<NoteEntity> {
    const {
      title,
      content,
      is_public,
      folderId,
      isPinned,
      isDeleted,
      isLocked,
      isFavorite,
      paperType,
      paperColor,
    } = dto;

    const sanitizedContent = content
      ? sanitizeHtml(content, {
          allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
          allowedAttributes: {},
        })
      : '';

    const public_slug = is_public ? uuidv4() : undefined;

    const newNote = this.noteRepository.create({
      title,
      content: sanitizedContent,
      is_public: is_public ?? false,
      public_slug,
      folderId,
      isPinned: isPinned ?? false,
      isDeleted: isDeleted ?? false,
      isLocked: isLocked ?? false,
      isFavorite: isFavorite ?? false,
      paperType: paperType ?? 'blank',
      paperColor: paperColor ?? 'white',
      user,
    });

    const savedNote = await this.noteRepository.save(newNote);

    if (savedNote.is_public) {
      await this.cacheManager.del('public_notes_list');
    }

    return savedNote;
  }

  async updateNote(
    user: UserEntity,
    noteId: number,
    dto: UpdateNoteDto,
  ): Promise<NoteEntity> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId, user: { id: user.id } },
    });
    if (!note) {
      throw new NotFoundException('Not bulunamadı');
    }

    if (dto.content !== undefined) {
      dto.content = sanitizeHtml(dto.content, {
        allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        allowedAttributes: {},
      });
    }

    Object.assign(note, dto);

    if (note.is_public && !note.public_slug) {
      note.public_slug = uuidv4();
    } else if (!note.is_public) {
      note.public_slug = null as any;
    }

    const savedNote = await this.noteRepository.save(note);
    return savedNote;
  }

  async getNoteBySlug(slug: string): Promise<SharedNotePayload> {
    const cacheKey = `note:public:${slug}`;

    const cachedNote = await this.cacheManager.get<SharedNotePayload>(cacheKey);
    if (cachedNote) {
      return cachedNote;
    }

    const note = await this.noteRepository.findOne({
      where: { public_slug: slug, is_public: true },
    });

    if (!note) {
      throw new NotFoundException('Not bulunamadı veya erişim reddedildi');
    }

    const payload = {
      title: note.title,
      content: note.content,
      created_at: note.created_at,
      public_slug: note.public_slug,
    };

    await this.cacheManager.set(cacheKey, payload, 300000);

    return payload;
  }
}
