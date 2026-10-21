export interface PromptTemplate {
  readonly id: string;
  readonly template: string;
}

const PROMPTS: Record<string, PromptTemplate> = {
  classification: {
    id: 'classification',
    template: 'Classify the following request: {{input}}. Context: {{context}}',
  },
};

export function registerPrompt(prompt: PromptTemplate): void {
  PROMPTS[prompt.id] = prompt;
}

export function getPromptTemplate(id: string): PromptTemplate | null {
  return PROMPTS[id] ?? null;
}

export function fillPromptTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_, key: string) => {
    const value = context[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

