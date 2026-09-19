import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [NotesModule],
  controllers: [HealthController],
})
export class AppModule {}
