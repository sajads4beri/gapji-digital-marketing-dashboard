import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  const envPaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const counts = {
    eventEquipments: await prisma.eventEquipment.count(),
    meetings: await prisma.meeting.count(),
    ideas: await prisma.idea.count(),
    leadActivities: await prisma.leadActivity.count(),
    leadCalls: await prisma.leadCall.count(),
    smsRecipients: await prisma.smsRecipient.count(),
    webinarAttendees: await prisma.webinarAttendee.count(),
    taskSubtasks: await prisma.taskSubtask.count(),
  };
  console.log('Ancillary Counts:', counts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
