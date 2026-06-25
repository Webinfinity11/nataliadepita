import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { markRead, deleteMessage } from "./actions";

export default async function MessagesPage() {
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Messages</h1>
      {rows.length === 0 && (
        <p className="text-sm text-neutral-500">No messages yet.</p>
      )}
      {rows.map((m) => (
        <div key={m.id} className={`border p-3 ${m.read ? "opacity-60" : ""}`}>
          <div className="flex justify-between text-sm text-neutral-500">
            <span>
              {m.name} — {m.email}
            </span>
            <span>{m.createdAt.toISOString().slice(0, 10)}</span>
          </div>
          <p className="my-2 whitespace-pre-wrap">{m.message}</p>
          <div className="flex gap-3 text-sm">
            {!m.read && (
              <form action={markRead}>
                <input type="hidden" name="id" value={m.id} />
                <button className="underline">Mark read</button>
              </form>
            )}
            <form action={deleteMessage}>
              <input type="hidden" name="id" value={m.id} />
              <button className="text-red-600">Delete</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
