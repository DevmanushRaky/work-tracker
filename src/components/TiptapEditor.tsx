import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

interface TiptapEditorProps {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  height?: number;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ value, onChange, error = false, height = 150 }) => {
  const editor = useEditor({
    extensions: [StarterKit, BulletList, OrderedList, ListItem],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>");
    }
    // eslint-disable-next-line
  }, [value]);

  const toolbarBtn = (isActive: boolean) =>
    `inline-flex items-center justify-center w-7 h-7 rounded-md border border-gray-200 transition-colors mx-0.5
    ${isActive ? "bg-indigo-100 text-indigo-700 border-indigo-300" : "bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"} focus:outline-none focus:ring-1 focus:ring-indigo-400`;

  return (
    <div className={`border rounded-lg bg-white ${error ? "border-red-500" : "border-gray-200"} shadow-sm`}>
      <style>{`
        .tiptap.ProseMirror {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          min-height: 120px;
          max-height: 300px;
          overflow-y: auto;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          line-height: 1.5;
        }
        .tiptap.ProseMirror:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        .tiptap.ProseMirror ul,
        .tiptap.ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.25em 0 0.25em 0;
          list-style-position: outside;
        }
        .tiptap.ProseMirror ul {
          list-style-type: disc !important;
        }
        .tiptap.ProseMirror ol {
          list-style-type: decimal !important;
        }
        .tiptap.ProseMirror li {
          margin: 0.1em 0;
        }
      `}</style>
      {editor && (
        <div className="flex gap-1 border-b p-1 bg-gray-50 rounded-t-lg">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={toolbarBtn(editor.isActive("bold"))}
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={toolbarBtn(editor.isActive("italic"))}
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={toolbarBtn(editor.isActive("bulletList"))}
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={toolbarBtn(editor.isActive("orderedList"))}
            title="Numbered List"
            aria-label="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="p-2 pt-1">
        <EditorContent
          editor={editor}
          className="tiptap"
          style={{
            minHeight: height,
            outline: "none",
            border: "none",
            boxShadow: "none",
            background: "transparent",
            resize: "none",
          }}
        />
      </div>
    </div>
  );
};

export default TiptapEditor; 