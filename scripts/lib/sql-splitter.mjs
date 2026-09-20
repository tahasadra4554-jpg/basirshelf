/**
 * Splits a SQL script into individual statements on `;` while ignoring
 * dollar-quoted function bodies (`$$ … $$`) and quoted strings.
 *
 * Shared by scripts/apply-supabase.mjs and scripts/test-sql.mjs so both paths
 * send exactly the same statements.
 */
export function splitStatements(sql) {
  const statements = [];
  let current = "";
  let i = 0;

  while (i < sql.length) {
    // line comment
    if (sql[i] === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      const stop = end === -1 ? sql.length : end;
      current += sql.slice(i, stop);
      i = stop;
      continue;
    }
    // single-quoted string literal
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length && sql[j] !== "'") {
        if (sql[j] === "\\") j += 1;
        j += 1;
      }
      current += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    // dollar-quoted body — keep everything until the matching closing tag
    if (sql[i] === "$") {
      const tag = /^\$[a-zA-Z_]*\$/.exec(sql.slice(i));
      if (tag) {
        const closing = sql.indexOf(tag[0], i + tag[0].length);
        const stop = closing === -1 ? sql.length : closing + tag[0].length;
        current += sql.slice(i, stop);
        i = stop;
        continue;
      }
    }
    if (sql[i] === ";") {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed + ";");
      current = "";
      i += 1;
      continue;
    }
    current += sql[i];
    i += 1;
  }

  const tail = current.trim();
  if (tail) statements.push(tail + ";");
  return statements;
}

/** First meaningful line of a statement, for readable progress output. */
export function statementLabel(statement) {
  const line = statement
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("--"));
  return (line ?? "").slice(0, 72);
}
