/**
 * Post-processing for VAPI/Deepgram transcripts.
 * Fixes common misrecognitions of English tech terms in Turkish speech,
 * and normalizes whitespace/formatting.
 */

type Replacement = string | ((match: string) => string);

const TERM_CORRECTIONS: [RegExp, Replacement][] = [
  // AI / acronyms
  [/\bE[- ]?[iİ]\b/gi, "AI"],
  [/\beyay\b/gi, "AI"],

  // Frameworks & runtimes
  [/\b(?:Mescies|Mesciyes|MesciGS|NesliJS|NesliGS|NESCS|NestGS|NESC|Nest[ -]?[Cc]ey[ -]?[Ee]s)\b/g, "NestJS"],
  [/\b(?:Next[ -]?[Cc]ey[ -]?[Ee]s|NextGS|NexGS)\b/g, "Next.js"],
  [/\b(?:Nod[ -]?[Cc]ey[ -]?[Ee]s|NodeGS|NodGS)\b/g, "Node.js"],
  [/\b(?:Riyekt|Riyakt)\b/g, "React"],
  [/\b(?:Tayp[ -]?skript|TaypScript)\b/gi, "TypeScript"],
  [/\b(?:Java[ -]?skript)\b/gi, "JavaScript"],
  [/\b(?:Eks[ -]?pres)\b/gi, "Express"],
  [/\b(?:Mongo[ -]?di[ -]?bi|MongoDb)\b/gi, "MongoDB"],
  [/\b(?:Post[ -]?gres[ -]?kyu[ -]?el|Postgre)\b/gi, "PostgreSQL"],
  [/\b(?:Doker)\b/g, "Docker"],
  [/\b(?:Kubernetis|Kubernatis)\b/gi, "Kubernetes"],
  [/\b(?:Graf[ -]?kyu[ -]?el|GrafQL)\b/gi, "GraphQL"],

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
  [/\bkomponentler\b/g, "component'ler"],
  [/\bkomponent\b/g, "component"],
  [/\bKomponentler\b/g, "Component'ler"],
  [/\bKomponent\b/g, "Component"],
  [/\bsteyt\b/gi, "state"],
  [/\bRest eypiai\b/gi, "REST API"],
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

  // CS terms
  [/\b[Dd]ependens[iy] [Ii]njekşın\b/g, "dependency injection"],
  [/\bMessig AS\b/gi, "NestJS"],
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

  // Normalize whitespace: collapse multiple spaces, trim lines
  result = result.replace(/[ \t]+/g, " ");
  result = result
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return result.trim();
}
