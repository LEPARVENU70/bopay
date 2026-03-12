import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  async chat(@Request() req, @Body('message') message: string) {
    const reply = await this.aiService.chat(req.user.merchantId, message);
    return { reply };
  }
}
