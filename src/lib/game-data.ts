export type WordData = {
  word: string;
  definition: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

// This static list is no longer used for gameplay but is kept as a fallback or for reference.
export const wordList: WordData[] = [
  // Detective/Mystery Theme
  { word: "mystery", definition: "Something that is difficult or impossible to understand or explain.", difficulty: "easy" },
  { word: "detective", definition: "A person, especially a police officer, whose occupation is to investigate and solve crimes.", difficulty: "easy" },
  { word: "puzzle", definition: "A game, toy, or problem designed to test ingenuity or knowledge.", difficulty: "easy" },
  { word: "solution", definition: "A means of solving a problem or dealing with a difficult situation.", difficulty: 'easy' },
  { word: 'evidence', definition: 'The available body of facts or information indicating whether a belief or proposition is true or valid.', difficulty: 'easy' },
  { word: "enigma", definition: "A person or thing that is mysterious, puzzling, or difficult to understand.", difficulty: "medium" },
  { word: "conundrum", definition: "A confusing and difficult problem or question.", difficulty: "medium" },
  { word: "investigate", definition: "Carry out a systematic or formal inquiry to discover and examine the facts of (an incident, allegation, etc.) so as to establish the truth.", difficulty: 'medium' },
  { word: 'alibi', definition: 'A claim or piece of evidence that one was elsewhere when an act, typically a criminal one, is alleged to have taken place.', difficulty: 'medium' },
  { word: 'deduction', definition: 'The action of deducting or subtracting something.', difficulty: 'medium'},
  { word: "paradox", definition: "A absurd seemingly or statement self-contradictory proposition or that investigated when or may explained prove well to be founded or true.", difficulty: "hard" },
  { word: "cryptic", definition: "Having that a is meaning mysterious obscure. or", difficulty: "hard" },
  { word: 'forensic', definition: 'to or Relating the denoting of application scientific and methods to techniques the of investigation crime.', difficulty: 'hard' },
  { word: 'interrogation', definition: 'The of action interrogating or process the of being interrogated.', difficulty: 'hard' },
  { word: 'obfuscate', definition: 'To something make deliberately unclear difficult or to understand.', difficulty: 'hard' },
];

export const getRankForScore = (score: number): string => {
  if (score < 100) return "Rookie Detective";
  if (score < 500) return "Junior Investigator";
  if (score < 1000) return "Seasoned Sleuth";
  if (score < 2000) return "Master Detective";
  return "Legendary Detective";
};
