"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Mengunggah gambar dan mengembalikan URL-nya. Editor sengaja tidak tahu ke
   * mana gambarnya diunggah supaya komponen ini bisa dipakai ulang di luar
   * blog.
   */
  onUploadImage?: (file: File) => Promise<string | undefined>;
}

/**
 * Editor tulisan untuk blog.
 *
 * Tombolnya sengaja dibatasi pada tag yang diizinkan pembersih HTML di server
 * (`apps/backend-system/src/blog/blog.sanitize.ts`). Judul dimulai dari H2
 * karena H1 sudah dipakai judul tulisan di halaman publik — satu halaman
 * sebaiknya hanya punya satu H1.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis isi artikel di sini...",
  disabled = false,
  onUploadImage,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    /// Wajib mati di Next.js: render pertama terjadi di server, sedangkan
    /// Tiptap butuh DOM.
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
        /// Tidak dipakai di tulisan blog dan hanya menambah tag yang harus
        /// diurus pembersih HTML.
        codeBlock: false,
      }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "rich-text min-h-70 w-full px-4 py-3 outline-none focus-visible:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.getHTML();
      /// Tiptap menyisakan satu paragraf kosong saat isinya dihapus habis.
      /// Dikirim sebagai string kosong supaya validasi "isi belum diisi"
      /// tetap berbunyi.
      onChange(current.isEmpty ? "" : html);
    },
  });

  /**
   * Menyalakan ulang isi editor saat nilai dari luar berubah — misalnya form
   * edit yang datanya baru tiba setelah halaman terbuka. Dibandingkan dulu
   * supaya pengetikan biasa tidak memindahkan kursor ke akhir.
   */
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (current === value) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const handlePickImage = async (file: File | undefined) => {
    if (!file || !editor || !onUploadImage) return;
    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setIsUploading(false);
    }
  };

  const handleLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt(
      "Alamat tautan (https://...)",
      previous ?? "https://",
    );
    if (input === null) return;

    const href = input.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    /// Hanya http/https dan mailto yang lolos pembersih HTML di server, jadi
    /// ditolak sejak di sini supaya tautannya tidak hilang diam-diam setelah
    /// disimpan.
    if (!/^(https?:\/\/|mailto:)/i.test(href)) {
      window.alert("Tautan harus diawali http://, https://, atau mailto:");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <div className="rounded-md border bg-background">
      <Toolbar
        editor={editor}
        disabled={disabled}
        isUploading={isUploading}
        onLink={handleLink}
        onImage={
          onUploadImage ? () => fileInputRef.current?.click() : undefined
        }
      />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handlePickImage(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function Toolbar({
  editor,
  disabled,
  isUploading,
  onLink,
  onImage,
}: {
  editor: Editor | null;
  disabled: boolean;
  isUploading: boolean;
  onLink: () => void;
  onImage?: () => void;
}) {
  /// Status tombol dibaca lewat useEditorState supaya toolbar ikut menyala
  /// saat kursor berpindah, tanpa memaksa seluruh form dirender ulang tiap
  /// ketukan tombol.
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      underline: current?.isActive("underline") ?? false,
      strike: current?.isActive("strike") ?? false,
      h2: current?.isActive("heading", { level: 2 }) ?? false,
      h3: current?.isActive("heading", { level: 3 }) ?? false,
      bulletList: current?.isActive("bulletList") ?? false,
      orderedList: current?.isActive("orderedList") ?? false,
      blockquote: current?.isActive("blockquote") ?? false,
      link: current?.isActive("link") ?? false,
      canUndo: current?.can().undo() ?? false,
      canRedo: current?.can().redo() ?? false,
    }),
  });

  if (!editor) {
    return <div className="h-11 border-b bg-muted/40" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1">
      <ToolbarButton
        label="Tebal"
        active={state?.bold}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Miring"
        active={state?.italic}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Garis bawah"
        active={state?.underline}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Coret"
        active={state?.strike}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Judul bagian"
        active={state?.h2}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        label="Sub judul"
        active={state?.h3}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 />
      </ToolbarButton>
      <ToolbarButton
        label="Daftar titik"
        active={state?.bulletList}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Daftar nomor"
        active={state?.orderedList}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton
        label="Kutipan"
        active={state?.blockquote}
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label={state?.link ? "Ubah tautan" : "Sisip tautan"}
        active={state?.link}
        disabled={disabled}
        onClick={onLink}
      >
        <LinkIcon />
      </ToolbarButton>
      {state?.link && (
        <ToolbarButton
          label="Lepas tautan"
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
          }
        >
          <Unlink />
        </ToolbarButton>
      )}
      {onImage && (
        <ToolbarButton
          label={isUploading ? "Mengunggah gambar..." : "Sisip gambar"}
          disabled={disabled || isUploading}
          onClick={onImage}
        >
          <ImagePlus />
        </ToolbarButton>
      )}

      <Separator />

      <ToolbarButton
        label="Batalkan"
        disabled={disabled || !state?.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        label="Ulangi"
        disabled={disabled || !state?.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 />
      </ToolbarButton>
    </div>
  );
}

function Separator() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={cn("size-8", active && "bg-accent text-accent-foreground")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
