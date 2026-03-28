/**
 * Session-scoped speech-to-text cleanup for **user** transcripts.
 *
 * Turkish ASR often garbles English product names. We do **not** mirror the global
 * transcript-normalizer approach (endless static terms). Here, replacements run only when
 * the canonical technology is part of the **current** interview (`field` + `techStack`).
 *
 * Prefer platform fixes when available: ElevenLabs agent → Scribe keyterms / language /
 * pronunciation dictionary for your workspace (see .env.example notes).
 */

export interface InterviewLexiconContext {
  field: string;
  techStack: string[];
}

/** Lowercase slug → common STT mis-hearings for that term (apply only if slug is active). */
const STT_ALIASES_BY_SLUG: Record<string, string[]> = {
  docker: ["takır", "takir", "tokır", "tokir", "dokır", "dokir", "dockır", "dockir"],
  kubernetes: ["kubernetis", "kubernatis"],
  nestjs: ["neslijs", "nesligi", "nesci"],
  typescript: ["taypskript", "tayp skript"],
  javascript: ["cava skript"],
  react: ["riyakt", "riyekt"],
  redis: ["reddis", "red is"],
  kafka: ["kafca"],
  graphql: ["grafql", "graf kuel"],
  mongodb: ["mongo dibi", "mongo db"],
  postgresql: ["postgre sql", "post gres"],
  prisma: ["prizma", "prızma"],
};

/** When stack uses compound names (e.g. Docker Compose) we still need a spelling for slug `docker`. */
const FALLBACK_DISPLAY: Record<string, string> = {
  docker: "Docker",
  kubernetes: "Kubernetes",
  nestjs: "NestJS",
  typescript: "TypeScript",
  javascript: "JavaScript",
  react: "React",
  redis: "Redis",
  kafka: "Kafka",
  graphql: "GraphQL",
  mongodb: "MongoDB",
  postgresql: "PostgreSQL",
  prisma: "Prisma",
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugifyTechLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\.js$/i, "js")
    .replace(/[^a-z0-9+]+/gi, "")
    .replace(/nodejs/i, "node")
    .replace(/nextjs/i, "next");
}

/** Map slug → preferred display string from user selections */
function buildSlugToDisplay(ctx: InterviewLexiconContext): Map<string, string> {
  const m = new Map<string, string>();
  const add = (label: string) => {
    const t = label.trim();
    if (t.length < 2) return;
    const slug = slugifyTechLabel(t);
    if (!slug) return;
    if (!m.has(slug)) m.set(slug, t);
  };
  add(ctx.field);
  for (const x of ctx.techStack) add(x);
  return m;
}

/** Slugs from explicit labels (field + stack items). */
function slugsFromLabels(ctx: InterviewLexiconContext): Set<string> {
  const s = new Set<string>();
  const f = slugifyTechLabel(ctx.field);
  if (f) s.add(f);
  for (const x of ctx.techStack) {
    const g = slugifyTechLabel(x);
    if (g) s.add(g);
  }
  return s;
}

/**
 * Also enable parent slugs when stack text mentions them (e.g. "Docker Compose" → docker).
 */
function harvestRelatedSlugs(ctx: InterviewLexiconContext): Set<string> {
  const s = slugsFromLabels(ctx);
  const blob = [ctx.field, ...ctx.techStack].join(" ").toLowerCase();
  if (blob.includes("docker")) s.add("docker");
  if (blob.includes("kubernetes") || blob.includes("k8s")) s.add("kubernetes");
  if (blob.includes("nestjs") || blob.includes("nest js")) s.add("nestjs");
  if (blob.includes("typescript") || blob.includes("type script")) s.add("typescript");
  if (blob.includes("javascript") || blob.includes("java script")) s.add("javascript");
  if (blob.includes("react")) s.add("react");
  if (blob.includes("redis")) s.add("redis");
  if (blob.includes("kafka")) s.add("kafka");
  if (blob.includes("graphql") || blob.includes("graph ql")) s.add("graphql");
  if (blob.includes("mongo")) s.add("mongodb");
  if (blob.includes("postgres")) s.add("postgresql");
  if (blob.includes("prisma")) s.add("prisma");
  return s;
}

/**
 * Repair obvious STT substitutions for technologies **selected for this interview only**.
 */
export function applySessionLexicon(
  text: string,
  ctx: InterviewLexiconContext,
): string {
  if (!text?.trim()) return text;
  const slugs = harvestRelatedSlugs(ctx);
  if (slugs.size === 0) return text;

  const displayFor = buildSlugToDisplay(ctx);
  let out = text;

  for (const slug of slugs) {
    const aliases = STT_ALIASES_BY_SLUG[slug];
    if (!aliases?.length) continue;
    const display = displayFor.get(slug) ?? FALLBACK_DISPLAY[slug];
    if (!display) continue;

    for (const aliasRaw of aliases) {
      const alias = aliasRaw.trim();
      if (alias.length < 2) continue;
      const re = new RegExp(`\\b${escapeRegExp(alias)}\\b`, "gi");
      out = out.replace(re, display);
    }
  }

  return out;
}
