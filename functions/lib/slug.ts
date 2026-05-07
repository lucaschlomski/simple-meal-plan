const WORDS = [
  "amber",
  "apple",
  "basil",
  "beach",
  "berry",
  "birch",
  "bloom",
  "cedar",
  "chili",
  "cinder",
  "cliff",
  "cloud",
  "copper",
  "coral",
  "dawn",
  "dune",
  "elm",
  "fern",
  "field",
  "flame",
  "forest",
  "frost",
  "garden",
  "glade",
  "glow",
  "grove",
  "harbor",
  "hazel",
  "honey",
  "island",
  "jade",
  "lake",
  "leaf",
  "linen",
  "maple",
  "meadow",
  "mint",
  "moss",
  "oasis",
  "olive",
  "pearl",
  "pine",
  "plum",
  "rain",
  "ridge",
  "river",
  "rose",
  "saffron",
  "sage",
  "sand",
  "shell",
  "sky",
  "spruce",
  "stone",
  "sunset",
  "tide",
  "timber",
  "vale",
  "willow",
  "wind"
];

const RESERVED = new Set(["admin", "api", "assets", "favicon", "functions"]);

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug);
}

export function createThreeWordSlug(): string {
  return `${randomWord()}-${randomWord()}-${randomWord()}`;
}
