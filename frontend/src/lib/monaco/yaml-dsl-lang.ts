import type * as Monaco from "monaco-editor";

const PREDICATE_NAMES = [
  "has_indicator", "has_ttp", "has_malware", "has_threat_actor", "has_campaign",
  "has_domain", "has_ip", "has_hash", "has_email", "has_url", "has_cve",
  "has_platform", "tlp_at_most", "confidence_above", "observed_after", "observed_before",
  "stix_type", "stix_rel", "count_indicators", "all_of", "any_of", "none_of",
  "not", "hypothesis_has_tag", "investigation_status", "audit_ceiling",
];

export function registerYamlDslLanguage(monaco: typeof Monaco): void {
  monaco.languages.registerCompletionItemProvider("yaml", {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      return {
        suggestions: PREDICATE_NAMES.map((name) => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: name,
          range,
        })),
      };
    },
  });
}
