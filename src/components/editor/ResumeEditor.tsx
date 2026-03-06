'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

import EditorToolbar from '@/components/editor/EditorToolbar';

interface ResumeEditorProps {
  content: string;
  onUpdate: (html: string, plainText: string) => void;
}

export default function ResumeEditor({ content, onUpdate }: ResumeEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: 'Start typing your resume, or paste your existing resume here...',
      }),
      CharacterCount,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[600px] md:min-h-[1056px] px-4 py-6 sm:px-8 sm:py-12 md:px-[96px] md:py-[96px]',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const plainText = currentEditor.getText();
      onUpdate(html, plainText);
    },
  });

  // Sync external content changes into the editor
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor scroll area */}
      <div className="flex-1 overflow-y-auto bg-[var(--background)] md:bg-[var(--background)]">
        <div className="mx-auto py-0 md:py-8">
          {/* Document page - full width on mobile, fixed page on desktop */}
          <div
            className="mx-auto min-h-screen bg-[var(--surface)] md:min-h-[1056px] md:shadow-[var(--shadow-paper)]"
            style={{
              maxWidth: '816px',
              width: '100%',
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Character / word count footer */}
      {editor && (
        <div className="flex items-center justify-end gap-4 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-xs text-[var(--text-tertiary)]">
          <span><span className="font-[family-name:var(--font-mono)]">{editor.storage.characterCount.characters()}</span> characters</span>
          <span><span className="font-[family-name:var(--font-mono)]">{editor.storage.characterCount.words()}</span> words</span>
        </div>
      )}

      {/* Placeholder and editor styles */}
      <style jsx global>{`
        .tiptap p.is-editor-placeholder::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .tiptap p.is-empty::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .tiptap {
          font-family: Arial, sans-serif;
        }

        .tiptap h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 0;
          margin-bottom: 0.5rem;
        }

        .tiptap h2 {
          font-size: 1.375rem;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 1rem;
          margin-bottom: 0.375rem;
        }

        .tiptap h3 {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 0.75rem;
          margin-bottom: 0.25rem;
        }

        .tiptap p {
          margin-top: 0;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .tiptap ul,
        .tiptap ol {
          padding-left: 1.5rem;
          margin-top: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .tiptap li {
          margin-bottom: 0.125rem;
        }

        .tiptap li p {
          margin-bottom: 0;
        }

        .tiptap hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 1rem 0;
        }

        .tiptap mark {
          border-radius: 2px;
          padding: 0 2px;
        }

        .tiptap a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }

        .tiptap a:hover {
          color: var(--accent);
        }

        .tiptap blockquote {
          border-left: 3px solid var(--border);
          padding-left: 1rem;
          margin-left: 0;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
