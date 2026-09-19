import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Note } from './note.entity';

/**
 * Keeps the notes in memory and mirrors them to a JSON file, so the data
 * survives a container restart when the file lives on a volume.
 */
@Injectable()
export class NotesStore implements OnModuleInit {
  private readonly logger = new Logger(NotesStore.name);
  private readonly file = join(process.env.DATA_DIR ?? './data', 'notes.json');
  private notes = new Map<string, Note>();
  private pendingWrite: Promise<void> = Promise.resolve();

  async onModuleInit(): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    await this.load();
  }

  all(): Note[] {
    return [...this.notes.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  find(id: string): Note | undefined {
    return this.notes.get(id);
  }

  save(note: Note): Note {
    this.notes.set(note.id, note);
    this.flush();
    return note;
  }

  remove(id: string): boolean {
    const removed = this.notes.delete(id);
    if (removed) {
      this.flush();
    }
    return removed;
  }

  private async load(): Promise<void> {
    try {
      const raw = await readFile(this.file, 'utf8');
      const notes = JSON.parse(raw) as Note[];
      this.notes = new Map(notes.map((note) => [note.id, note]));
      this.logger.log(`Loaded ${this.notes.size} note(s) from ${this.file}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.log(`No store at ${this.file} yet, starting empty`);
        return;
      }
      throw error;
    }
  }

  /** Queues a full rewrite; the temp file plus rename keeps it atomic. */
  private flush(): void {
    const snapshot = JSON.stringify([...this.notes.values()], null, 2);
    const tmp = `${this.file}.tmp`;

    this.pendingWrite = this.pendingWrite
      .then(async () => {
        await writeFile(tmp, snapshot, 'utf8');
        await rename(tmp, this.file);
      })
      .catch((error: unknown) => {
        this.logger.error(`Could not persist notes to ${this.file}`, error);
      });
  }
}
