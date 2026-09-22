import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, { realtime: { transport: undefined } });

const { data: sections, error } = await supabase.from("sections").select("*").eq("book_id", "b0000000-1000-4000-8000-100000000001").order("sort_order");
console.log("error", error);
console.log("sections count", sections?.length);
console.log(sections?.slice(0,3));

const { data: files, error: filesError } = await supabase.from("section_files").select("*").limit(5);
console.log("files error", filesError);
console.log("files", files);
