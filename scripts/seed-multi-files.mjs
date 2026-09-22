import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const raw = fs.readFileSync(DB_PATH, "utf8");
const db = JSON.parse(raw);

if (!db.section_files) db.section_files = [];

const targetSectionId = db.sections[1]?.id; // Unit 1
if (!targetSectionId) {
  console.error("No sections found");
  process.exit(1);
}

console.log("Seeding files for section:", targetSectionId, db.sections[1].title);

// Clear existing files for this section
db.section_files = db.section_files.filter(f => f.section_id !== targetSectionId);

const now = new Date().toISOString();

const filesToAdd = [
  // 3 videos
  { type: "video", name: "Grammar - Present Simple", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", sort_order: 0 },
  { type: "video", name: "Vocabulary - Greetings", url: "https://www.youtube.com/watch?v=jNQXAC9IVRw", sort_order: 1 },
  { type: "video", name: "Conversation - Introductions", url: "https://www.youtube.com/watch?v=9bZkp7q19f0", sort_order: 2 },
  // 2 audios
  { type: "audio", name: "Listening - Track 1", url: "/audio/lesson-audio.wav", sort_order: 0 },
  { type: "audio", name: "Listening - Track 2 - Pronunciation", url: "/audio/lesson-audio.wav", sort_order: 1 },
  // 4 PDFs
  { type: "pdf", name: "Handout - Grammar Notes", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", sort_order: 0 },
  { type: "pdf", name: "Worksheet - Exercises", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", sort_order: 1 },
  { type: "pdf", name: "Vocabulary List - Unit 1", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", sort_order: 2 },
  { type: "pdf", name: "Answer Key", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", sort_order: 3 },
  // 5 images
  { type: "image", name: "Classroom Poster - Greetings", url: "https://picsum.photos/seed/greet1/800/600", sort_order: 0 },
  { type: "image", name: "Flashcard - Hello", url: "https://picsum.photos/seed/hello/800/600", sort_order: 1 },
  { type: "image", name: "Flashcard - Good Morning", url: "https://picsum.photos/seed/morning/800/600", sort_order: 2 },
  { type: "image", name: "Dialogue - Example", url: "https://picsum.photos/seed/dialogue/800/600", sort_order: 3 },
  { type: "image", name: "Culture - World Map", url: "https://picsum.photos/seed/map/800/600", sort_order: 4 },
];

for (const f of filesToAdd) {
  db.section_files.push({
    id: randomUUID(),
    section_id: targetSectionId,
    type: f.type,
    name: f.name,
    url: f.url,
    sort_order: f.sort_order,
    created_at: now,
  });
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + "\n", "utf8");
console.log(`Added ${filesToAdd.length} files to section ${targetSectionId}`);
console.log("Counts:", {
  video: db.section_files.filter(f => f.type === "video" && f.section_id === targetSectionId).length,
  audio: db.section_files.filter(f => f.type === "audio" && f.section_id === targetSectionId).length,
  pdf: db.section_files.filter(f => f.type === "pdf" && f.section_id === targetSectionId).length,
  image: db.section_files.filter(f => f.type === "image" && f.section_id === targetSectionId).length,
});
