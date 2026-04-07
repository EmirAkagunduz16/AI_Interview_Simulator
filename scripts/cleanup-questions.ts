/**
 * One-time cleanup script for the questions collection.
 *
 * What it does:
 * 1. Removes non-question entries (greetings, AI responses without '?')
 * 2. Cleans up conversational prefixes from question text
 * 3. Merges duplicate questions (sums usageCount, keeps the one with highest count)
 *
 * Usage:
 *   npx tsx scripts/cleanup-questions.ts
 *
 * Set MONGODB_URI env var if not using default (mongodb://localhost:27017/question_db)
 */

import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/question_db";
const COLLECTION = "questions";

// Patterns that indicate AI conversational text, NOT real questions
const NON_QUESTION_PATTERNS = [
  /^merhaba/i,
  /^merhabalar/i,
  /^hoş?\s*geldin/i,
  /^selam/i,
  /^güzel\s+cevap/i,
  /^harika\s+cevap/i,
  /^teşekkür/i,
  /^tebrik/i,
  /^bravo/i,
  /^mülakatınız/i,
  /^mülakat\s+deneyimi/i,
  /^bir\s+mülakat\s+deneyimi/i,
  /^backend\s+alanı\s+için/i,
  /^frontend\s+alanı\s+için/i,
  /^fullstack\s+alanı\s+için/i,
  /^mobile\s+alanı\s+için/i,
  /^devops\s+alanı\s+için/i,
  /^data\s*science\s+alanı\s+için/i,
];

// Prefixes to strip from question content
const STRIP_PREFIXES = [
  /^(?:peki|tamam|güzel|harika|evet|doğru|aynen|kesinlikle)[,.\s]+/i,
  /^(?:tam da bu yüzden|tam olarak|çok iyi|çok güzel)[,.\s]+/i,
  /^(?:güzel cevap|harika cevap|iyi cevap)[,.\s]+/i,
  /^(?:başlayalım|devam edelim|bir sonraki soru|şimdi)[,.\s]+/i,
  /^(?:ilk|ikinci|üçüncü|sonraki|bir sonraki|son)\s+soru(?:m|muz)?[:\s]*/i,
  /^soru(?:m|muz)?\s*(?:\d+)?[:\s]*/i,
];

async function main() {
  console.log(`Connecting to ${MONGODB_URI}...`);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection(COLLECTION);

  const totalBefore = await collection.countDocuments();
  console.log(`Total questions before cleanup: ${totalBefore}`);

  // ── Step 1: Remove non-questions ──
  let removedCount = 0;
  const allQuestions = await collection
    .find({ createdBy: { $in: ["seed", "ai-generated"] } })
    .toArray();

  console.log(
    `\nChecking ${allQuestions.length} seed/ai-generated questions...`,
  );

  const toRemove: ObjectId[] = [];
  for (const q of allQuestions) {
    const content = (q.content || "").trim();

    // No question mark = not a question
    if (!content.includes("?")) {
      toRemove.push(q._id as ObjectId);
      continue;
    }

    // Matches non-question pattern
    if (NON_QUESTION_PATTERNS.some((p) => p.test(content))) {
      toRemove.push(q._id as ObjectId);
      continue;
    }

    // Too short to be meaningful
    if (content.length < 25) {
      toRemove.push(q._id as ObjectId);
      continue;
    }
  }

  if (toRemove.length > 0) {
    const result = await collection.deleteMany({
      _id: { $in: toRemove },
    });
    removedCount = result.deletedCount;
    console.log(`Removed ${removedCount} non-question entries`);
  } else {
    console.log("No non-question entries found to remove");
  }

  // ── Step 2: Clean up conversational prefixes ──
  let cleanedCount = 0;
  const remaining = await collection.find({}).toArray();

  for (const q of remaining) {
    let content = (q.content || "").trim();
    const originalContent = content;

    // Extract question part if text has conversational prefix + question
    if (content.includes("?")) {
      const sentences = content.split(/(?<=[.!?])\s+/);
      const firstQIdx = sentences.findIndex((s) => s.includes("?"));
      if (firstQIdx > 0) {
        // There's non-question text before the actual question
        const startIdx = Math.max(0, firstQIdx - 1);
        content = sentences.slice(startIdx).join(" ").trim();
      }
    }

    // Strip prefixes
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of STRIP_PREFIXES) {
        const before = content;
        content = content.replace(p, "");
        if (content !== before) changed = true;
      }
    }

    content = content.trim();
    if (content.length > 0) {
      content = content.charAt(0).toUpperCase() + content.slice(1);
    }

    if (content !== originalContent && content.length > 20) {
      await collection.updateOne(
        { _id: q._id },
        {
          $set: {
            content,
            title: content.slice(0, 200),
          },
        },
      );
      cleanedCount++;
    }
  }
  console.log(`Cleaned prefixes from ${cleanedCount} questions`);

  // ── Step 3: Merge duplicates ──
  console.log("\nLooking for duplicates...");

  // Group by first 100 chars of content + category
  const pipeline = [
    { $match: { isActive: true } },
    {
      $group: {
        _id: {
          prefix: { $substrCP: ["$content", 0, 100] },
          category: "$category",
        },
        ids: { $push: "$_id" },
        usageCounts: { $push: "$usageCount" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ];

  const duplicateGroups = await collection.aggregate(pipeline).toArray();
  let mergedCount = 0;

  for (const group of duplicateGroups) {
    const ids: ObjectId[] = group.ids;
    const usageCounts: number[] = group.usageCounts;

    // Find the one with highest usage count — keep it
    let maxIdx = 0;
    let maxCount = usageCounts[0] || 0;
    for (let i = 1; i < usageCounts.length; i++) {
      if ((usageCounts[i] || 0) > maxCount) {
        maxCount = usageCounts[i] || 0;
        maxIdx = i;
      }
    }

    const keepId = ids[maxIdx];
    const removeIds = ids.filter((_, i) => i !== maxIdx);
    const totalUsage = usageCounts.reduce((sum, c) => sum + (c || 0), 0);

    // Update the kept question with sum of all usage counts
    await collection.updateOne(
      { _id: keepId },
      { $set: { usageCount: totalUsage } },
    );

    // Delete the duplicates
    await collection.deleteMany({ _id: { $in: removeIds } });
    mergedCount += removeIds.length;
  }

  console.log(
    `Merged ${duplicateGroups.length} duplicate groups, removed ${mergedCount} duplicates`,
  );

  const totalAfter = await collection.countDocuments();
  console.log(`\nTotal questions after cleanup: ${totalAfter}`);
  console.log(
    `Summary: removed ${removedCount} non-questions, cleaned ${cleanedCount} prefixes, merged ${mergedCount} duplicates`,
  );

  await client.close();
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
