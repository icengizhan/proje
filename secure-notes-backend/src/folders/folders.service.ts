import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderEntity } from './folder.entity';
import { NoteEntity } from '../notes/note.entity';
import { UserEntity } from '../users/user.entity';
import { CreateFolderDto } from './dto/create-folder.dto';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(FolderEntity)
    private readonly folderRepository: Repository<FolderEntity>,
    @InjectRepository(NoteEntity)
    private readonly noteRepository: Repository<NoteEntity>,
  ) {}

  async getUserFolders(user: UserEntity): Promise<FolderEntity[]> {
    return this.folderRepository.find({
      where: { user: { id: user.id } },
    });
  }

  async createFolder(user: UserEntity, dto: CreateFolderDto): Promise<FolderEntity> {
    const newFolder = this.folderRepository.create({
      name: dto.name,
      user,
    });
    return this.folderRepository.save(newFolder);
  }

  async deleteFolder(user: UserEntity, folderId: number): Promise<void> {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId, user: { id: user.id } },
    });
    if (!folder) {
      throw new NotFoundException('Klasör bulunamadı');
    }

    // Nullify folderId on all notes in this folder (don't delete the notes)
    await this.noteRepository
      .createQueryBuilder()
      .update(NoteEntity)
      .set({ folderId: null as any })
      .where('folderId = :folderId', { folderId })
      .execute();

    await this.folderRepository.remove(folder);
  }
}
