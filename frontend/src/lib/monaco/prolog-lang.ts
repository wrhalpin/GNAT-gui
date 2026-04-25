import type * as Monaco from "monaco-editor";

export function registerPrologLanguage(monaco: typeof Monaco): void {
  monaco.languages.register({ id: "prolog" });

  monaco.languages.setMonarchTokensProvider("prolog", {
    tokenizer: {
      root: [
        [/%.*$/, "comment"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/'([^'\\]|\\.)*'/, "string"],
        [/\b\d+(\.\d+)?\b/, "number"],
        [/[A-Z_][a-zA-Z0-9_]*/, "variable"],
        [/[a-z][a-zA-Z0-9_]*/, "identifier"],
        [/[(),.|:-]/, "delimiter"],
        [/:-|-->|=\.\.|\\\+|\\=|=:=|=\\=|<|>|=<|>=/, "operator"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration("prolog", {
    brackets: [["(", ")"], ["[", "]"]],
    autoClosingPairs: [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
      { open: "'", close: "'" },
    ],
    comments: { lineComment: "%" },
  });
}
