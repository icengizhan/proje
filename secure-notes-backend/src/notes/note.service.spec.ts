import { Test, TestingModule } from '@nestjs/testing';
import { NoteService } from './note.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NoteEntity } from './note.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('NoteService', () => {
  let service: NoteService;
  const mockNoteRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoteService,
        { provide: getRepositoryToken(NoteEntity), useValue: mockNoteRepo },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<NoteService>(NoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a note', async () => {
    const dto = { title: 'T', content: 'C' };
    const user = { id: 1 } as any;
    mockNoteRepo.create.mockReturnValue({ ...dto, user });
    mockNoteRepo.save.mockResolvedValue({ id: 1, ...dto, user });

    const result = await service.createNote(user, dto);
    expect(result).toHaveProperty('id');
  });

  it('should return notes only for owner', async () => {
    mockNoteRepo.find.mockResolvedValue([{ id: 1, userId: 1 }]);
    const result = await service.getUserNotes({ id: 1 } as any);
    expect(mockNoteRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user: { id: 1 } } }),
    );
  });

  it('should prevent deleting foreign note', async () => {
    mockNoteRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateNote({ id: 2 } as any, 1, { isDeleted: true }),
    ).rejects.toThrow();
  });
});
