import { Module } from '@nestjs/common';
import { UserMediaController } from './user-media.controller';
import { UserMediaService } from './user-media.service';
import { SourceService } from '../source/source.service';

@Module({
  controllers: [UserMediaController],
  providers: [UserMediaService, SourceService],
  exports: [UserMediaService],
})
export class UserMediaModule {}

