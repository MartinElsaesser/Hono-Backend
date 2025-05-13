import { db } from "../db.js";
import { HASH_CONFIG } from "../../helpers/configs.js";

import { cp, rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

void (async function seed() {
  await db.deleteFrom("todo").execute();

  await db
    .insertInto("todo")
    .values([
      {
        headline: "Buy groceries",
        description: "I need:\n* Cucumbers\n* Milk\n* Strawberries",
        done: false,
      },
      {
        headline: "Go to the gym",
        description: "I need to go to the gym at least 3 times a week",
        done: false,
      },
      {
        headline: "Read a book",
        description: "I need to read at least 1 book a month",
        done: false,
      },
      {
        headline: "Learn a new language",
        description: "I need to learn a new language",
        done: false,
      },
      {
        headline: "Write a blog post",
        description:
          "I need to write a blog post about my experience with Kysely",
        done: false,
      },
    ])
    .execute();
})();
