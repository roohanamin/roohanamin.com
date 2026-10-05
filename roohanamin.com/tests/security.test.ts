import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("database enforces tenant isolation, ownership, constraints and descending order", async () => {
  const db = new PGlite();
  const alice = "10000000-0000-4000-8000-000000000001",
    bob = "20000000-0000-4000-8000-000000000001";
  const first = "30000000-0000-4000-8000-000000000001",
    second = "30000000-0000-4000-8000-000000000002";
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values ('${alice}'),('${bob}');`);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610050001_weight_entries.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const asUser = async (id: string) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await db.exec("set role authenticated");
    };
    await asUser(alice);
    await db.query(
      "insert into public.weight_entries(id,weight_kg,measured_on) values ($1,75,$2),($3,76,$4)",
      [first, "2026-10-04", second, "2026-10-05"],
    );
    assert.equal(
      (await db.query("select * from public.weight_entries")).rows.length,
      2,
    );
    await assert.rejects(
      db.query(
        "insert into public.weight_entries(user_id,weight_kg,measured_on) values ($1,70,$2)",
        [bob, "2026-10-05"],
      ),
      /row-level security/,
    );
    await assert.rejects(
      db.query("update public.weight_entries set user_id=$1 where id=$2", [
        bob,
        first,
      ]),
      /row-level security/,
    );
    await assert.rejects(
      db.exec(
        "insert into public.weight_entries(weight_kg,measured_on) values (0,'2026-10-05')",
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.exec(
        "insert into public.weight_entries(weight_kg,unit,measured_on) values (75,'stone','2026-10-05')",
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.exec(
        "insert into public.weight_entries(weight_kg,note,measured_on) values (75,repeat('x',301),'2026-10-05')",
      ),
      /check constraint/,
    );
    await asUser(bob);
    assert.equal(
      (await db.query("select * from public.weight_entries")).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "update public.weight_entries set weight_kg=5 where id=$1 returning id",
          [first],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "delete from public.weight_entries where id=$1 returning id",
          [first],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into public.weight_entries(id,weight_kg,measured_on) values ($1,5,$2) on conflict(id) do update set weight_kg=excluded.weight_kg",
        [first, "2026-10-05"],
      ),
      /row-level security/,
    );
    await asUser(alice);
    assert.equal(
      (
        await db.query<{ id: string }>(
          "select id from public.weight_entries order by measured_on desc,created_at desc,id desc",
        )
      ).rows[0].id,
      second,
    );
    assert.equal(
      (
        await db.query(
          "update public.weight_entries set weight_kg=74 where id=$1 returning id",
          [first],
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          "delete from public.weight_entries where id=$1 returning id",
          [first],
        )
      ).rows.length,
      1,
    );
    await db.exec("reset role; set role anon");
    for (const sql of [
      "select * from public.weight_entries",
      "insert into public.weight_entries(weight_kg,measured_on) values(75,'2026-10-05')",
      "update public.weight_entries set weight_kg=5",
      "delete from public.weight_entries",
    ])
      await assert.rejects(db.exec(sql), /permission denied/);
  } finally {
    await db.close();
  }
});
