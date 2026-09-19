import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './note.entity';
import { NotesStore } from './notes.store';

@Injectable()
export class NotesService {
  constructor(private readonly store: NotesStore) {}

  list(): Note[] {
    return this.store.all();
  }

  get(id: string): Note {
    const note = this.store.find(id);
    if (!note) {
      throw new NotFoundException(`No note with id ${id}`);
    }
    return note;
  }

  create(dto: CreateNoteDto): Note {
    const now = new Date().toISOString();
    return this.store.save({
      id: randomUUID(),
      title: dto.title,
      body: dto.body,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id: string, dto: UpdateNoteDto): Note {
    const note = this.get(id);
    return this.store.save({
      ...note,
      title: dto.title ?? note.title,
      body: dto.body ?? note.body,
      updatedAt: new Date().toISOString(),
    });
  }

  remove(id: string): void {
    if (!this.store.remove(id)) {
      throw new NotFoundException(`No note with id ${id}`);
    }
  }
}
