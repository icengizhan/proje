import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';

describe('UploadController', () => {
  let controller: UploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should handle file upload properly', async () => {
    const mockFile = { filename: 'test.jpg' } as any;
    const result = await controller.uploadFile(mockFile);
    expect(result).toHaveProperty('url');
    expect(result.url).toContain('test.jpg');
  });
});
