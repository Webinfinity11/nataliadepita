"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";

export function Editor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  useEffect(() => () => editor?.destroy(), [editor]);
  if (!editor) return null;
  return (
    <div className="border">
      <div className="flex gap-2 border-b p-2 text-sm">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => {
            const url = prompt("Image URL");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
        >
          Image
        </button>
      </div>
      <EditorContent editor={editor} className="prose max-w-none p-3 min-h-48" />
    </div>
  );
}
