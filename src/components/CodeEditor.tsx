import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { PaneHeader } from "./panes/PaneHeader";
import { usePaneChrome } from "./panes/PaneContext";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
}

export function CodeEditor({ value, onChange, onClose }: CodeEditorProps) {
  // Docked in the accordion the column is auto-height, so `h-full` would
  // collapse the editor to nothing — give it a bounded, scrollable height.
  const { docked } = usePaneChrome();
  const extensions = useMemo(
    () => [
      html(),
      EditorView.theme({
        "&": {
          fontSize: "12px",
          height: "100%",
        },
        ".cm-scroller": {
          overflow: "auto",
          fontFamily: "'JetBrains Mono', monospace",
        },
      }),
    ],
    [],
  );

  return (
    <div className={`flex min-h-0 flex-col ${docked ? "h-[360px]" : "h-full"}`}>
      <PaneHeader title="Edit HTML" onClose={onClose} />
      <div className="min-h-0 flex-1">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={oneDark}
        height="100%"
        style={{ height: "100%" }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          bracketMatching: true,
          autocompletion: true,
        }}
      />
      </div>
    </div>
  );
}