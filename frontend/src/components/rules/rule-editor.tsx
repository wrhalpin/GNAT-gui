import { useEffect, useRef } from "react";
import type { Rule } from "@/api/queries/rules";

interface Props {
  rule: Rule;
  onChange: (content: string) => void;
  onInsertText?: (fn: (text: string) => void) => void;
}

export function RuleEditor({ rule, onChange, onInsertText }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;

    import("monaco-editor").then(async (monaco) => {
      if (disposed || !containerRef.current) return;

      const { registerHyLanguage } = await import("@/lib/monaco/hy-lang");
      const { registerYamlDslLanguage } = await import("@/lib/monaco/yaml-dsl-lang");
      const { registerPrologLanguage } = await import("@/lib/monaco/prolog-lang");

      registerHyLanguage(monaco);
      registerYamlDslLanguage(monaco);
      registerPrologLanguage(monaco);

      const language = rule.engine === "hy" ? "hy" : rule.engine === "yaml" ? "yaml" : "prolog";

      editorRef.current = monaco.editor.create(containerRef.current!, {
        value: rule.content,
        language,
        theme: "vs-dark",
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
      });

      editorRef.current.onDidChangeModelContent(() => {
        onChange(editorRef.current.getValue());
      });

      if (onInsertText) {
        onInsertText((text: string) => {
          const pos = editorRef.current.getPosition();
          editorRef.current.executeEdits("insert", [{
            range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
            text,
          }]);
          editorRef.current.focus();
        });
      }
    });

    return () => {
      disposed = true;
      editorRef.current?.dispose();
    };
    // Intentionally re-init only when the rule identity/engine changes. onChange
    // (a stable setState) and onInsertText are captured once by design; the editor
    // is not torn down on every content edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule.id, rule.engine]);

  return <div ref={containerRef} className="h-full w-full" />;
}
