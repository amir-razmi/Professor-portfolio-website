import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      prisma.$runCommandRaw({ ping: 1 }),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error("MongoDB ping timed out")), 5_000);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }

  console.log("MongoDB connectivity check passed.");
}

async function run() {
  let exitCode = 0;

  try {
    await main();
  } catch {
    console.error("MongoDB connectivity check failed.");
    exitCode = 1;
  }

  await Promise.race([
    prisma.$disconnect(),
    new Promise<void>((resolve) => {
      setTimeout(resolve, 1_000);
    }),
  ]);

  process.exit(exitCode);
}

void run();
