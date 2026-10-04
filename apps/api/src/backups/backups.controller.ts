import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Backup } from '@prince-net/types';
import { BackupsService } from './backups.service';

type AuthUser = { userId: string; email: string };

// جسم الاستعادة فارغ حاليًا — الطلب يُرسَل بدون body، لذا نسمح بـ undefined
const restoreSchema = z.object({}).strict().default({});

@Controller('backups')
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get()
  async list(): Promise<Backup[]> {
    return this.backupsService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ): Promise<Backup> {
    return this.backupsService.create(user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, fileName } = await this.backupsService.download(
      id,
      user.userId,
      {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    );

    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(buffer);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async removeAll(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ): Promise<{ success: boolean; deletedCount: number }> {
    return this.backupsService.removeAll(user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ): Promise<{ success: boolean }> {
    return this.backupsService.remove(id, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(restoreSchema)) _body: unknown,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ): Promise<{ success: boolean }> {
    return this.backupsService.restore(id, user.userId, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}
