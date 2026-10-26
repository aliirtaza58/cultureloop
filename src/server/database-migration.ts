/** Supabase db query uses prepared execution: one atomic statement, including all DDL. */
export function atomicMigration(sql: string): string {
  const delimiter = "$cultureloop_setup$";
  if (sql.includes(delimiter)) throw new Error("Migration delimiter conflicts with its SQL.");
  return `DO ${delimiter}\nBEGIN\n${sql}\nEND;\n${delimiter};`;
}
