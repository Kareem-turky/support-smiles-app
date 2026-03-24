import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsService } from '../events/events.service';

@Module({
    imports: [PrismaModule],
    controllers: [MessagesController],
    providers: [MessagesService, EventsService],
})
export class MessagesModule { }
