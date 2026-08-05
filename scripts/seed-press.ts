import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

// The first piece of coverage, added here so the Press page is not empty on
// the day it ships. Everything after this is managed from the admin.
const FIRST = {
  title: "საქართველოს მოზაიკური მემკვიდრეობის სადარაჯოზე",
  publication: "Forbes Georgia",
  publishedOn: "მაისი 14, 2025",
  url: "https://forbes.ge/saqarthvelos-mozaikuri-memkvidreobis-sadarajoze/",
};

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const existing = await sql`
    select id from press_articles where url = ${FIRST.url}
  `;
  if (existing.length) {
    console.log("already present — nothing to do");
    return;
  }
  await sql`
    insert into press_articles (title, publication, published_on, url, position)
    values (${FIRST.title}, ${FIRST.publication}, ${FIRST.publishedOn}, ${FIRST.url}, 0)
  `;
  console.log("added:", FIRST.title);
}

main();
