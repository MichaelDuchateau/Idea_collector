import { useEffect, useRef, useState } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { marked } from 'marked';

interface Props {
  initialValue: string;
  onChange:     (value: string) => void;
  onSave:       (value: string) => void;
  readOnly?:    boolean;
}

export default function IdeaEditor({ initialValue, onChange, onSave, readOnly }: Props) {
  const editorRef  = useRef<HTMLDivElement>(null);
  const viewRef    = useRef<EditorView | null>(null);
  const [preview, setPreview]   = useState(false);
  const [content, setContent]   = useState(initialValue);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        oneDark,
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const val = update.state.doc.toString();
            setContent(val);
            onChange(val);
          }
        }),
        EditorView.editable.of(!readOnly),
        EditorView.theme({
          '&': { height: '400px', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, monospace' },
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  }, []);

  const insertWrap = (prefix: string, suffix = prefix) => {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    view.dispatch({
      changes: { from, to, insert: `${prefix}${selected}${suffix}` },
      selection: { anchor: from + prefix.length, head: to + prefix.length },
    });
    view.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap">
        {[
          { label: 'B',   title: 'Bold',    action: () => insertWrap('**') },
          { label: 'I',   title: 'Italic',  action: () => insertWrap('_') },
          { label: 'H',   title: 'Heading', action: () => insertWrap('## ', '') },
          { label: '🔗',  title: 'Link',    action: () => insertWrap('[', '](url)') },
        ].map(btn => (
          <button
            key={btn.label}
            title={btn.title}
            onClick={btn.action}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 font-mono"
          >
            {btn.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setPreview(p => !p)}
            className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
          >
            {preview ? 'Editor' : 'Preview'}
          </button>
          <button
            onClick={() => onSave(content)}
            disabled={readOnly}
            className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {readOnly ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div
          className="prose prose-sm max-w-none border border-gray-200 rounded-md p-4 min-h-[400px] bg-white overflow-auto"
          dangerouslySetInnerHTML={{ __html: marked(content) as string }}
        />
      ) : (
        <div ref={editorRef} className="border border-gray-200 rounded-md overflow-hidden" />
      )}
    </div>
  );
}
