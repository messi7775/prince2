import {
    Body,
    Controller,
    Get,
    Patch,
    Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
    updateSettingsSchema,
    type UpdateSettingsInput,
} from '@prince-net/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

type AuthUser = { userId: string; email: string };

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    async get() {
        return this.settingsService.get();
    }

    @Patch()
    async update(
        @Body(new ZodValidationPipe(updateSettingsSchema))
        body: UpdateSettingsInput,
        @CurrentUser() user: AuthUser,
        @Req() req: Request,
    ) {
        return this.settingsService.update(body, user.userId, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    }
}