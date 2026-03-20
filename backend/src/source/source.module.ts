import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SourceController } from './source.controller';
import { SourceService } from './source.service';

@Module({
  imports: [CacheModule],
  controllers: [SourceController],
  providers: [SourceService],
  exports: [SourceService],
})
export class SourceModule {}

