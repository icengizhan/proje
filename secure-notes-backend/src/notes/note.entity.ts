import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../users/user.entity';

@Entity('notes')
export class NoteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  is_public: boolean;

  @Column({ type: 'char', length: 36, unique: true, nullable: true })
  public_slug: string;

  @Column({ nullable: true })
  folderId: number;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ default: false })
  isFavorite: boolean;

  @Column({ default: 'blank' })
  paperType: string;

  @Column({ default: 'white' })
  paperColor: string;

  @ManyToOne(() => UserEntity, (user) => user.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
