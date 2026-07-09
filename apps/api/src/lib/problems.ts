// RFC-7807-style problem responses, ported from Backend-main's
export type Problem = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: {
    form?: string[];
    fields?: Record<string, string[]>;
  };
};

// Base URI for problem `type` identifiers. Just an identifier the frontend
// can match on — it doesn't need to resolve to a real page.
const ERRORS_BASE_URL = process.env.ERRORS_BASE_URL ?? 'https://errors.serveless.app';

export const problemType = (slug: string) => `${ERRORS_BASE_URL}/${slug}`;

export const makeProblem = (p: Partial<Problem> & Pick<Problem, 'title' | 'status'>): Problem => {
  const base: Problem = {
    type: p.type ?? problemType('problem'),
    title: p.title,
    status: p.status,
    ...(p.detail && { detail: p.detail }),
  };

  if (p.errors) {
    return {
      ...base,
      errors: {
        form: p.errors.form ?? [],
        fields: p.errors.fields ?? {},
      },
    };
  }

  return base;
};

// Structural stand-in for zod's $ZodIssue so this package never depends on zod
// directly — the real issues come from schemas defined in @serveless/shared.
type ValidationIssue = { path: PropertyKey[]; message: string };

export const zodIssuesToProblem = (issues: readonly ValidationIssue[]) => {
  const fields: Record<string, string[]> = {};
  const form: string[] = [];
  for (const issue of issues) {
    const key = issue.path.length ? issue.path.join('.') : '';
    if (key) (fields[key] ??= []).push(issue.message);
    else form.push(issue.message);
  }
  return { fields, form };
};
