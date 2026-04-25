import type * as Monaco from "monaco-editor";

export function registerHyLanguage(monaco: typeof Monaco): void {
  monaco.languages.register({ id: "hy" });

  monaco.languages.setMonarchTokensProvider("hy", {
    keywords: ["defn", "fn", "let", "if", "when", "cond", "do", "import", "require", "and", "or", "not"],
    tokenizer: {
      root: [
        [/;.*$/, "comment"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/\b\d+(\.\d+)?\b/, "number"],
        [/[()[\]{}]/, "delimiter"],
        [/:[a-zA-Z_-][a-zA-Z0-9_-]*/, "keyword.control"],
        [/[a-zA-Z_-][a-zA-Z0-9_-]*/, {
          cases: {
            "@keywords": "keyword",
            "@default": "identifier",
          },
        }],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration("hy", {
    brackets: [["(", ")"], ["[", "]"], ["{", "}"]],
    autoClosingPairs: [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
      { open: "{", close: "}" },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
      { open: '"', close: '"' },
    ],
  });
}
