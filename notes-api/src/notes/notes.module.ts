import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NotesStore } from './notes.store';

@Module({
  controllers: [NotesController],
  providers: [NotesService, NotesStore],
})
export class NotesModule {}
