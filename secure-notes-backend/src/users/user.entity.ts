import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { NoteEntity } from '../notes/note.entity';
import { FolderEntity } from '../folders/folder.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ select: false })
  password_hash: string;

  @OneToMany(() => NoteEntity, (note) => note.user)
  notes: NoteEntity[];

  @OneToMany(() => FolderEntity, (folder) => folder.user)
  folders: FolderEntity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
