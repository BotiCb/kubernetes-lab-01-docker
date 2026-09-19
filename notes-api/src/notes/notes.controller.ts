import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './note.entity';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(): Note[] {
    return this.notes.list();
  }

  @Get(':id')
  get(@Param('id') id: string): Note {
    return this.notes.get(id);
  }

  @Post()
  create(@Body() dto: CreateNoteDto): Note {
    return this.notes.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto): Note {
    return this.notes.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): void {
    this.notes.remove(id);
  }
}
