import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../users/user.entity';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserFolders(@CurrentUser() user: UserEntity) {
    return this.foldersService.getUserFolders(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createFolder(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateFolderDto,
  ) {
    return this.foldersService.createFolder(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteFolder(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
  ) {
    await this.foldersService.deleteFolder(user, parseInt(id, 10));
    return { message: 'Klasör silindi' };
  }
}
