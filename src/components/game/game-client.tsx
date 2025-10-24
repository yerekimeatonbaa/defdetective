"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { getWordByDifficulty, type WordData, getRankForScore } from "@/lib/game-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Keyboard } from "@/components/game/keyboard";
import { Lightbulb, RotateCw, XCircle, Award, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getHintAction, getSoundAction } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { useSound } from "@/hooks/use-sound";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { UserProfile } from "@/lib/firebase-types";

type GameState = "playing" | "won" | "lost";
type Difficulty = "easy" | "medium" | "hard";
const MAX_INCORRECT_TRIES = 6;

type SoundMap = {
  [key: string]: string | null;
}

export default function GameClient() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [gameState, setGameState] = useState<GameState>("playing");
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [definition, setDefinition] = useState<string>("");
  const [guessedLetters, setGuessedLetters] = useState<{ correct: string[]; incorrect: string[] }>({ correct: [], incorrect: [] });
  const [hint, setHint] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isHintLoading, startHintTransition] = useTransition();

  const [sounds, setSounds] = useState<SoundMap>({});
  const { playSound } = useSound();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, "userProfiles", user.uid) : null
  , [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  
  useEffect(() => {
    if(userProfile) {
      setScore(userProfile.totalScore);
      setLevel(userProfile.highestLevel);
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchSounds = async () => {
      const soundKeys = ['correct', 'incorrect', 'win'];
      const soundPromises = soundKeys.map(key => getSoundAction(key));
      const results = await Promise.all(soundPromises);
      const newSounds: SoundMap = {};
      results.forEach((result, index) => {
        if (result.soundDataUri) {
          newSounds[soundKeys[index]] = result.soundDataUri;
        }
      });
      setSounds(newSounds);
    };
    fetchSounds();
  }, []);

  const { toast } = useToast();

  const getDifficultyForLevel = (level: number): Difficulty => {
    if (level <= 5) return 'easy';
    if (level <= 10) return 'medium';
    return 'hard';
  };

  const startNewGame = useCallback((level: number) => {
    const difficulty = getDifficultyForLevel(level);
    const newWordData = getWordByDifficulty(difficulty);
    setWordData(newWordData);
    setDefinition(newWordData.definition);
    setGuessedLetters({ correct: [], incorrect: [] });
    setHint(null);
    setGameState("playing");
  }, []);

  useEffect(() => {
    startNewGame(level);
  }, [level, startNewGame]);

  const handleGuess = useCallback((letter: string) => {
    if (gameState !== "playing" || guessedLetters.correct.includes(letter) || guessedLetters.incorrect.includes(letter)) {
      return;
    }

    const lowerLetter = letter.toLowerCase();
    if (wordData?.word.toLowerCase().includes(lowerLetter)) {
      setGuessedLetters(prev => ({ ...prev, correct: [...prev.correct, lowerLetter] }));
      if (sounds.correct) playSound(sounds.correct);
    } else {
      setGuessedLetters(prev => ({ ...prev, incorrect: [...prev.incorrect, lowerLetter] }));
      if (sounds.incorrect) playSound(sounds.incorrect);
    }
  }, [wordData, gameState, guessedLetters, sounds, playSound]);

  const handleHintRequest = () => {
    if (!wordData) return;
    startHintTransition(async () => {
      const { hint: newHint, error } = await getHintAction({
        word: wordData.word,
        incorrectGuesses: guessedLetters.incorrect,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Hint Error",
          description: error,
        });
      } else if (newHint) {
        setHint(newHint);
        setScore(s => Math.max(0, s - 5)); // Penalty for using hint
      }
    });
  };

  const displayedWord = useMemo(() => {
    if (!wordData) return [];
    const wordChars = wordData.word.split('');
    return wordChars.map((char, index) => {
      const lowerChar = char.toLowerCase();
      const isGuessed = guessedLetters.correct.includes(lowerChar);
      const isHinted = hint?.split('')[index]?.toLowerCase() === lowerChar;
      if (isGuessed || isHinted) {
        return { char, revealed: true };
      }
      return { char, revealed: false };
    });
  }, [wordData, guessedLetters.correct, hint]);

  const updateFirestoreUser = useCallback(async (scoreGained: number, newLevel: number) => {
    if (user && firestore) {
        const userRef = doc(firestore, "userProfiles", user.uid);
        
        // We need to get the current score to calculate the new rank
        const userDoc = await getDoc(userRef);
        const currentScore = userDoc.data()?.totalScore ?? 0;
        const newTotalScore = currentScore + scoreGained;
        const newRank = getRankForScore(newTotalScore);
        
        const updateData = {
            totalScore: increment(scoreGained),
            highestLevel: newLevel,
            rank: newRank,
            updatedAt: new Date().toISOString(),
        };

        updateDoc(userRef, updateData)
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    }
}, [user, firestore]);

useEffect(() => {
    if (!wordData || gameState !== "playing") return;

    const isWon = wordData.word.split('').every(char => guessedLetters.correct.includes(char.toLowerCase()));
    
    if (isWon) {
      setGameState("won");
      if (sounds.win) playSound(sounds.win);
      
      const difficulty = getDifficultyForLevel(level);
      const scoreGained = (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30);
      
      const newLevel = level + 1;
      updateFirestoreUser(scoreGained, newLevel);
      setScore(s => s + scoreGained);
      
      setTimeout(() => {
        setLevel(newLevel);
        startNewGame(newLevel);
      }, 2000);

    } else if (guessedLetters.incorrect.length >= MAX_INCORRECT_TRIES) {
      setGameState("lost");
    }
  }, [guessedLetters, wordData, level, sounds, playSound, startNewGame, updateFirestoreUser, gameState]);


  const incorrectTriesLeft = MAX_INCORRECT_TRIES - guessedLetters.incorrect.length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-lg">
          <Award className="h-6 w-6 text-primary" />
          Score: <span className="font-bold">{score.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-lg">
          Level: <span className="font-bold">{level}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Definition</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-lg italic text-muted-foreground p-4 bg-muted/50 rounded-md">{definition}</p>
        </CardContent>
      </Card>

      <div className="flex justify-center items-center gap-2 md:gap-4 my-8">
        {displayedWord.map(({ char, revealed }, index) => (
          <div key={index} className="flex items-center justify-center h-12 w-12 md:h-16 md:w-16 border-b-4 border-primary text-3xl md:text-4xl font-bold uppercase bg-muted/30 rounded-md">
            {revealed && <span className="animate-in fade-in zoom-in-50 duration-500">{char}</span>}
          </div>
        ))}
      </div>
      
      {(gameState === "won" || gameState === "lost") ? (
        <Alert variant={gameState === 'won' ? 'default' : 'destructive'} className="text-center">
           {gameState === 'won' ? <PartyPopper className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertTitle className="text-2xl font-bold">
            {gameState === 'won' ? "You solved it!" : "Case closed... incorrectly."}
          </AlertTitle>
          <AlertDescription>
            {gameState === 'won' ? `The word was "${wordData?.word}". Loading next case...` : `The word was "${wordData?.word}". Better luck next time.`}
          </AlertDescription>
          {gameState === 'lost' && (
             <div className="mt-4 flex justify-center gap-4">
                <Button onClick={() => { setLevel(1); setScore(0); startNewGame(1); }}>
                    <RotateCw className="mr-2 h-4 w-4" /> Start Over
                </Button>
            </div>
          )}
        </Alert>
      ) : (
        <>
          <div className="flex justify-center">
            <Button onClick={handleHintRequest} disabled={isHintLoading || !user}>
              <Lightbulb className={cn("mr-2 h-4 w-4", isHintLoading && "animate-spin")} />
              {isHintLoading ? 'Getting Hint...' : 'Get a Hint (-5 score)'}
            </Button>
          </div>
          {!user && <p className="text-center text-destructive text-sm">Please log in to use hints and save progress.</p>}
          <p className="text-center text-muted-foreground">Incorrect Guesses: {guessedLetters.incorrect.join(', ').toUpperCase()} ({incorrectTriesLeft} left)</p>
          <Keyboard onKeyClick={handleGuess} guessedLetters={guessedLetters} />
        </>
      )}
    </div>
  );
}
