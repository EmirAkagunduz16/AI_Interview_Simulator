/**
 * Post-processing for ElevenLabs conversational transcripts.
 * Fixes common misrecognitions of English tech terms in Turkish speech,
 * collapses agent filler loops, and normalizes whitespace/formatting.
 */

type Replacement = string | ((match: string) => string);

/** Placeholder/empty messages (e.g. "..." from speech recognition) that should not be shown or saved */
const PLACEHOLDER_PATTERNS = [
  /^\.{2,}$/, // ... or ....
  /^…+$/, // … (unicode ellipsis)
  /^[.\s]+$/, // dots and whitespace only
  /^[.,;:\s]+$/, // punctuation only
];

export function isPlaceholderMessage(text: string): boolean {
  const t = text?.trim() || "";
  if (!t) return true;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(t));
}

/** Erroneous/hallucinated phrases that should not be shown (e.g. from misconfigured agent) */
const ERRONEOUS_PHRASES = [
  /cumhurba[sş]kanl[iı]ğ[iı]/i,
  /cumhurbaskanligi/i,
  /geçiş yapılıyor.*lütfen bekleyin/i,
];

/**
 * Collapses repeated silence / “still thinking” filler the agent sometimes stacks
 * when turn detection misfires (same bubble, many copies).
 */
export function sanitizeAgentTranscript(text: string): string {
  let t = text?.trim() || "";
  if (!t) return t;

  const fillerLong =
    /(Anladım[, ]+h[âa]l[âa]\s+d[üu]ş[üu]n[üu]yorsunuz\.?\s*S[üu]rd[üu]r[üu]yoruz[, ]+bekliyorum\.?\s*){2,}/gi;
  t = t.replace(
    fillerLong,
    "Anladım, hâlâ düşünüyorsunuz. Sürdürüyoruz, bekliyorum. ",
  );

  const fillerShort =
    /(Anladım[, ]+h[âa]l[âa]\s+d[üu]ş[üu]n[üu]yorsunuz\.?\s*){2,}/gi;
  t = t.replace(fillerShort, "Anladım, hâlâ düşünüyorsunuz. ");

  const sentences = t.split(/(?<=[.!?…])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    const x = s.trim();
    if (!x) continue;
    if (out.length > 0 && out[out.length - 1] === x) continue;
    out.push(x);
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

export function containsErroneousContent(text: string): boolean {
  const t = text?.trim() || "";
  if (!t) return false;
  return ERRONEOUS_PHRASES.some((re) => re.test(t));
}

const TERM_CORRECTIONS: [RegExp, Replacement][] = [
  // AI / acronyms
  [/\bE[- ]?[iİ]\b/gi, "AI"],
  [/\beyay\b/gi, "AI"],
  [/\bCI ?\/? ?CD\b/gi, "CI/CD"],
  [/\bsi aydı\b/gi, "CI/CD"],

  // Frameworks & runtimes
  [
    /\b(?:Mescies|Mesciyes|MesciGS|NesliJS|NesliGS|NESCS|NestGS|NESC|Nest[ -]?[Cc]ey[ -]?[Ee]s|nescaese|Messig ?AS|nestcess|nescess)\b/gi,
    "NestJS",
  ],
  [/\b(?:Next[ -]?[Cc]ey[ -]?[Ee]s|NextGS|NexGS|next ?ces)\b/gi, "Next.js"],
  [/\b(?:Nod[ -]?[Cc]ey[ -]?[Ee]s|NodeGS|NodGS|nod ?ces)\b/gi, "Node.js"],
  [/\b(?:Riyekt|Riyakt|riyekt)\b/g, "React"],
  [/\b(?:Tayp[ -]?skript|TaypScript|tayp ?skript)\b/gi, "TypeScript"],
  [/\b(?:Java[ -]?skript|cava ?skript)\b/gi, "JavaScript"],
  [/\b(?:Eks[ -]?pres|ekspres)\b/gi, "Express"],
  [/\b(?:Mongo[ -]?di[ -]?bi|MongoDb|mongo ?dibi)\b/gi, "MongoDB"],
  [/\b(?:Post[ -]?gres[ -]?kyu[ -]?el|Postgre|postgre ?sql)\b/gi, "PostgreSQL"],
  [/\b(?:Doker|doker)\b/g, "Docker"],
  [/\b(?:Kubernetis|Kubernatis|kubernetis)\b/gi, "Kubernetes"],
  [/\b(?:Graf[ -]?kyu[ -]?el|GrafQL|graf ?kuel)\b/gi, "GraphQL"],
  [/\b(?:Prisma|prisma)\b/g, "Prisma"],
  [/\b(?:Rediss?|reddis)\b/gi, "Redis"],
  [/\b(?:veb ?pak|web ?pak)\b/gi, "Webpack"],
  [/\b(?:veb ?soket|web ?soket)\b/gi, "WebSocket"],

  // ASR often turns "Middleware, Guards" into unrelated tokens (e.g. product names)
  [/\bS3\s*,\s*Stix\b/gi, "Middleware, Guards"],
  [/\bS3\s+Stix\b/gi, "Middleware Guards"],
  [/\bStix\b/gi, "Guards"],
  [/\bdepolastik\b/gi, "repository"],
  [/\bk[ıi]r[ıi]t[ıi]ld[ıi]ğ[ıi]nda\b/gi, "fırlatıldığında"],
  [/\b[İi]stemiçi\b/gi, "istemci"],

  // Common Turkish misrecognitions of English tech terms
  [/\b[Bb]ackhemt\b/g, "backend"],
  [/\b[Bb]ackent\b/g, "backend"],
  [/\b[Bb]ekent\b/g, "backend"],
  [/\b[Ff]rontent\b/g, "frontend"],
  [/\bkontrolörler\b/g, "controller'lar"],
  [/\bkontrolör\b/g, "controller"],
  [/\bKontrolörler\b/g, "Controller'lar"],
  [/\bKontrolör\b/g, "Controller"],
  [/\b[Mm]idılver\b/g, "middleware"],
  [/\b[Mm]idilver\b/g, "middleware"],
  [/\bkomponentler\b/g, "component'ler"],
  [/\bkomponent\b/g, "component"],
  [/\bKomponentler\b/g, "Component'ler"],
  [/\bKomponent\b/g, "Component"],
  [/\bsteyt\b/gi, "state"],
  [/\bRest eypiai\b/gi, "REST API"],
  [/\brest ?api\b/gi, "REST API"],
  [/\bservisler\b/g, "service'ler"],
  [/\bServisler\b/g, "Service'ler"],
  [/\bservis\b/g, "service"],
  [/\bServis\b/g, "Service"],
  [/\bmodüller\b/g, "module'ler"],
  [/\bModüller\b/g, "Module'ler"],
  [/\bmodül\b/g, "module"],
  [/\bModül\b/g, "Module"],
  [/\bdekoratörler\b/g, "decorator'lar"],
  [/\bDekoratörler\b/g, "Decorator'lar"],
  [/\bdekoratör\b/g, "decorator"],
  [/\bDekoratör\b/g, "Decorator"],
  [/\bsağlayıcılar\b/g, "provider'lar"],
  [/\bSağlayıcılar\b/g, "Provider'lar"],
  [/\bsağlayıcı\b/g, "provider"],
  [/\bSağlayıcı\b/g, "Provider"],

  // CS / architecture terms
  [/\b[Dd]ependens[iy] [Ii]njekşın\b/g, "dependency injection"],
  [/\bpendince injtion\b/gi, "dependency injection"],
  [/\bdi ?ay\b/gi, "DI"],
  [/\bmikro ?servis\b/gi, "microservice"],
  [/\bMikro ?servis\b/g, "Microservice"],
  [/\b[Ee]ndpoynt\b/g, "endpoint"],
  [/\b[Ee]ntpoynt\b/g, "endpoint"],
  [/\brepozitori\b/gi, "repository"],
  [/\b[Rr]epository\b/g, "repository"],
  [/\bengradan\b/gi, "Angular'dan"],
  [/\bengra\b/gi, "Angular"],
  [/\b[Ss]ingılton\b/g, "singleton"],
  [/\b[Ff]aktory\b/g, "factory"],
  [/\b[Oo]bserver\b/g, "observer"],
  [/\b[Ss]tream\b/g, "stream"],
  [/\b[Pp]romis\b/g, "promise"],
  [/\b[Kk]allbek\b/g, "callback"],
  [/\b[Kk]ollbek\b/g, "callback"],
  [/\basenkron\b/gi, "asenkron"],
  [/\b[Kk]eşleme\b/g, "caching"],
  [/\b[Kk]eş\b/g, "cache"],
  [/\b[Şş]ema\b/g, "schema"],
  [/\b[İi]ndeks\b/g, "index"],
  [/\b[Kk]uery\b/g, "query"],
  [/\b[Mm]igrasyon\b/g, "migration"],
  [/\b[Dd]eploy\b/g, "deploy"],
  [/\b[Dd]eployment\b/g, "deployment"],
  [/\b[Ll]od balans[ıi]r?\b/gi, "load balancer"],
  [/\b[Ss]kalabilite\b/g, "scalability"],
  [/\b[Ss]kala\b/g, "scale"],
  [/\b[Pp]erformans\b/g, "performans"],
];

export function normalizeTranscript(text: string): string {
  let result = text;

  for (const [pattern, replacement] of TERM_CORRECTIONS) {
    if (typeof replacement === "string") {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement);
    }
  }

  result = result.replace(/[ \t]+/g, " ");
  result = result
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return result.trim();
}
