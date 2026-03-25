export function injectVariables(text: string, variables: Record<string, string>): string {
  if (!text) return '';
  // Replaces occurrences of {{variable}} with its value
  return text.replace(/\{\{([\w:-]+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}
