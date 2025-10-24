export type WordData = {
  word: string;
  definition: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

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
  { word: "paradox", definition: "A seemingly absurd or self-contradictory statement or proposition that when investigated or explained may prove to be well founded or true.", difficulty: "hard" },
  { word: "cryptic", definition: "Having a meaning that is mysterious or obscure.", difficulty: "hard" },
  { word: 'forensic', definition: 'Relating to or denoting the application of scientific methods and techniques to the investigation of crime.', difficulty: 'hard' },
  { word: 'interrogation', definition: 'The action of interrogating or the process of being interrogated.', difficulty: 'hard' },
  { word: 'obfuscate', definition: 'To deliberately make something unclear or difficult to understand.', difficulty: 'hard' },

  // General Vocabulary
  { word: "apple", definition: "A round fruit with firm, white flesh and a green or red skin.", difficulty: "easy" },
  { word: "house", definition: "A building for human habitation, especially one that is lived in by a family or small group of people.", difficulty: "easy" },
  { word: "ocean", definition: "A very large expanse of sea, in particular each of the main areas into which the sea is divided geographically.", difficulty: "easy" },
  { word: "journey", definition: "An act of travelling from one place to another.", difficulty: "easy" },
  { word: "friend", definition: "A person with whom one has a bond of mutual affection, typically one exclusive of sexual or family relations.", difficulty: "easy" },
  { word: "courage", definition: "The ability to do something that frightens one; bravery.", difficulty: "medium" },
  { word: "wisdom", definition: "The quality of having experience, knowledge, and good judgement; the quality of being wise.", difficulty: "medium" },
  { word: "nostalgia", definition: "A sentimental longing or wistful affection for a period in the past.", difficulty: "medium" },
  { word: "ambition", definition: "A strong desire to do or achieve something, typically requiring determination and hard work.", difficulty: "medium" },
  { word: "generate", definition: "Cause (something, especially an emotion or situation) to arise or come about.", difficulty: "medium" },
  { word: "ephemeral", definition: "Lasting for a very short time.", difficulty: "hard" },
  { word: "ubiquitous", definition: "Present, appearing, or found everywhere.", difficulty: "hard" },
  { word: "mellifluous", definition: "Pleasingly smooth and musical to hear.", difficulty: "hard" },
  { word: "sycophant", definition: "A person who acts obsequiously towards someone important in order to gain advantage.", difficulty: "hard" },
  { word: "pulchritudinous", definition: "Having great physical beauty.", difficulty: "hard" },
  
  // Science & Nature
  { word: "gravity", definition: "The force that attracts a body towards the centre of the earth, or towards any other physical body having mass.", difficulty: "easy" },
  { word: "forest", definition: "A large area covered chiefly with trees and undergrowth.", difficulty: "easy" },
  { word: "planet", definition: "A celestial body moving in an elliptical orbit round a star.", difficulty: "easy" },
  { word: "photosynthesis", definition: "The process by which green plants use sunlight to synthesize foods from carbon dioxide and water.", difficulty: "medium" },
  { word: "ecosystem", definition: "A biological community of interacting organisms and their physical environment.", difficulty: "medium" },
  { word: "evolution", definition: "The process by which different kinds of living organism are believed to have developed from earlier forms during the history of the earth.", difficulty: "medium" },
  { word: "nebula", definition: "A cloud of gas and dust in outer space, visible in the night sky either as an indistinct bright patch or as a dark silhouette against other luminous matter.", difficulty: "hard" },
  { word: "bioluminescence", definition: "The biochemical emission of light by living organisms such as fireflies and deep-sea fish.", difficulty: "hard" },
  { word: "mycology", definition: "The scientific study of fungi.", difficulty: "hard" }
];

export const getWordByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): WordData => {
  const wordsOfDifficulty = wordList.filter(w => w.difficulty === difficulty);
  return wordsOfDifficulty[Math.floor(Math.random() * wordsOfDifficulty.length)];
}

export const getRankForScore = (score: number): string => {
  if (score < 100) return "Rookie Detective";
  if (score < 500) return "Junior Investigator";
  if (score < 1000) return "Seasoned Sleuth";
  if (score < 2000) return "Master Detective";
  return "Legendary Detective";
};
