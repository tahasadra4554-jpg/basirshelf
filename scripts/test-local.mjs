import { localStore } from "../src/lib/db/local.ts";

const book = await localStore.getBookWithFiles("b0000000-1000-4000-8000-100000000001");
console.log("sections", book.sections.length);
const sec = book.sections.find(s => s.id === "ebc744df-0311-4c43-b0ef-a9dd74ae30ae");
console.log("target section", sec.title, sec.files.length);
console.log(sec.files.map(f => `${f.type}:${f.name}`));
