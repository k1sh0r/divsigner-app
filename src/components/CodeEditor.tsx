import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
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
    <div className="h-full min-h-0">
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
  );
}