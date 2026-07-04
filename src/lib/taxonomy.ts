// Ultra Lab taxonomia — ez adja a tudastar strukturajat.
// Minden cikk ezekbol a kategoriakbol kap tag-eket (lasd: content frontmatter).

export type RaceType =
  | "backyard-ultra"
  | "100-mile"
  | "100k"
  | "50k"
  | "multiday"
  | "trail-general";

export type Topic =
  | "felkeszules"
  | "taplalkozas"
  | "mentalis-strategia"
  | "alvasmenedzsment"
  | "felszereles"
  | "serulesmegelozes"
  | "versenynapi-taktika"
  | "regeneracio";

export type Level = "kezdo" | "halado" | "elit";

export interface TaxonomyEntry {
  slug: string;
  labelHu: string;
  labelEn: string;
  description: string;
}

export const RACE_TYPES: Record<RaceType, TaxonomyEntry> = {
  "backyard-ultra": {
    slug: "backyard-ultra",
    labelHu: "Backyard Ultra",
    labelEn: "Backyard Ultra",
    description: "Orankenti 6706m korok, amig csak egy futo marad.",
  },
  "100-mile": {
    slug: "100-mile",
    labelHu: "100 mérföld",
    labelEn: "100 Mile",
    description: "Klasszikus 161 km-es tavok.",
  },
  "100k": {
    slug: "100k",
    labelHu: "100 km",
    labelEn: "100K",
    description: "Egynapos 100 kilométeres versenyek.",
  },
  "50k": {
    slug: "50k",
    labelHu: "50 km",
    labelEn: "50K",
    description: "Belepo szintu ultratavok.",
  },
  multiday: {
    slug: "multiday",
    labelHu: "Tobbnapos verseny",
    labelEn: "Multiday Race",
    description: "Tobb napon atívelo, gyakran szakaszolt versenyek.",
  },
  "trail-general": {
    slug: "trail-general",
    labelHu: "Altalanos trail/ultra",
    labelEn: "General Trail/Ultra",
    description: "Tavtol fuggetlen, altalanos ultrafutó tapasztalat.",
  },
};

export const TOPICS: Record<Topic, TaxonomyEntry> = {
  felkeszules: {
    slug: "felkeszules",
    labelHu: "Felkészülés",
    labelEn: "Training & Preparation",
    description: "Edzesterv, periodizacio, felkeszulesi filozofiak.",
  },
  taplalkozas: {
    slug: "taplalkozas",
    labelHu: "Táplálkozás",
    labelEn: "Nutrition & Fueling",
    description: "Fueling strategia verseny kozben es elotte.",
  },
  "mentalis-strategia": {
    slug: "mentalis-strategia",
    labelHu: "Mentális stratégia",
    labelEn: "Mental Strategy",
    description: "Hogyan marad valaki fokuszalt orakon, napokon at.",
  },
  alvasmenedzsment: {
    slug: "alvasmenedzsment",
    labelHu: "Alvásmenedzsment",
    labelEn: "Sleep Management",
    description: "Kulcskerdes tobbnapos es backyard versenyeken.",
  },
  felszereles: {
    slug: "felszereles",
    labelHu: "Felszerelés",
    labelEn: "Gear",
    description: "Cipo, taplalkozasi felszereles, fejlampa, ruhazat.",
  },
  serulesmegelozes: {
    slug: "serulesmegelozes",
    labelHu: "Sérülésmegelőzés",
    labelEn: "Injury Prevention",
    description: "Hogyan keruljuk el a tipikus ultrafutó serüleseket.",
  },
  "versenynapi-taktika": {
    slug: "versenynapi-taktika",
    labelHu: "Versenynapi taktika",
    labelEn: "Race Day Tactics",
    description: "Pacing, donteshozatal a verseny kozben.",
  },
  regeneracio: {
    slug: "regeneracio",
    labelHu: "Regeneráció",
    labelEn: "Recovery",
    description: "Verseny utani es versenyek kozotti regeneracio.",
  },
};

export const LEVELS: Record<Level, TaxonomyEntry> = {
  kezdo: {
    slug: "kezdo",
    labelHu: "Kezdő",
    labelEn: "Beginner",
    description: "Elso ultratavokra keszuloknek.",
  },
  halado: {
    slug: "halado",
    labelHu: "Haladó",
    labelEn: "Advanced",
    description: "Mar tobb ultratavot teljesitett futoknak.",
  },
  elit: {
    slug: "elit",
    labelHu: "Elit",
    labelEn: "Elite",
    description: "Versenyzoi szintu, top eredmenyekre torekvoknek.",
  },
};

export const ALL_RACE_TYPES = Object.values(RACE_TYPES);
export const ALL_TOPICS = Object.values(TOPICS);
export const ALL_LEVELS = Object.values(LEVELS);
