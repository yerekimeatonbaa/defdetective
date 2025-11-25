
'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { type WordData, getRankForScore } from "@/lib/game-data";
import { generateWord } from "@/ai/flows/generate-word-flow";
import { useHintAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Keyboard } from "@/components/game/keyboard";
import { Lightbulb, RotateCw, XCircle, Award, PartyPopper, Clapperboard, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameSounds } from "@/hooks/use-game-sounds";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, getDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { UserProfile } from "@/lib/firebase-types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import ShareButton from "@/components/game/share-button";


type GameState = "playing" | "won" | "lost";
type Difficulty = "easy" | "medium" | "hard";
const MAX_INCORRECT_TRIES = 6;

export default function Home() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [gameState, setGameState] = useState<GameState>("playing");
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [guessedLetters, setGuessedLetters] = useState<{ correct: string[]; incorrect: string[] }>({ correct: [], incorrect: [] });
  const [hint, setHint] = useState<string | null>(null);
  const [revealedByHint, setRevealedByHint] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isHintLoading, startHintTransition] = useTransition();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  const { playSound } = useGameSounds();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, "userProfiles", user.uid) : null
  , [firestore, user]);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
  
  useEffect(() => {
    if(userProfile) {
      setScore(userProfile.totalScore);
      setLevel(userProfile.highestLevel);
    }
  }, [userProfile]);

  const { toast } = useToast();
  
  const getDifficultyForLevel = (level: number): Difficulty => {
    if (level <= 5) return 'easy';
    if (level <= 10) return 'medium';
    return 'hard';
  };

  const startNewGame = useCallback(async (currentLevel: number, currentWord?: string) => {
    setIsGameLoading(true);
    setGameState("playing");
    const difficulty = getDifficultyForLevel(currentLevel);
    let newWordData: WordData | null = null;
    
    try {
        let attempts = 0;
        while(attempts < 3) { 
            const result = await generateWord({ difficulty });
            if (result.word.toLowerCase() !== currentWord?.toLowerCase()) {
                newWordData = { ...result, difficulty };
                break;
            }
            attempts++;
        }
        if (!newWordData) {
            throw new Error("Failed to generate a new word.");
        }
    } catch (error) {
        console.error("Failed to generate word.", error);
        toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Could not generate a new word. Please check your connection."
        });
        newWordData = null;
    }

    if(newWordData) {
        setWordData(newWordData);
        setGuessedLetters({ correct: [], incorrect: [] });
        setHint(null);
        setRevealedByHint([]);
    }
    setIsGameLoading(false);
  }, [toast]);

  useEffect(() => {
    startNewGame(1);
  }, [startNewGame]);


  const handleGuess = useCallback((letter: string) => {
    if (gameState !== "playing" || guessedLetters.correct.includes(letter) || guessedLetters.incorrect.includes(letter) || revealedByHint.includes(letter.toLowerCase())) {
      return;
    }

    const lowerLetter = letter.toLowerCase();
    if (wordData?.word.toLowerCase().includes(lowerLetter)) {
      setGuessedLetters(prev => ({ ...prev, correct: [...prev.correct, lowerLetter] }));
      playSound('correct');
    } else {
      setGuessedLetters(prev => ({ ...prev, incorrect: [...prev.incorrect, lowerLetter] }));
      playSound('incorrect');
    }
  }, [wordData, gameState, guessedLetters, playSound, revealedByHint]);

  const getHint = async (isFree: boolean = false) => {
    if (!wordData) return;
    if (!user && !isFree) {
        toast({
            variant: "destructive",
            title: "Login Required",
            description: "You must be logged in to use hints or watch ads.",
        });
        return;
    }
    
    startHintTransition(async () => {
      try {
        const result = await useHintAction({
            userId: user?.uid,
            word: wordData.word,
            incorrectGuesses: guessedLetters.incorrect.join(''),
            lettersToReveal: revealedByHint.length + 1,
            isFree: isFree,
        });

        if (result && result.success && result.hint) {
          setHint(result.hint);
          const newHintedLetters = result.hint.split('').filter((char: string) => char !== '_').map((char: string) => char.toLowerCase());
          setRevealedByHint(newHintedLetters);
          playSound('hint');
        } else {
           throw new Error(result.message || "Invalid response from server.");
        }
      } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Hint Error",
            description: error.message || 'Failed to get a hint. Please try again.',
          });
      }
    });
  };

  const handleRewardedAd = () => {
    if (!user) {
        toast({ variant: "destructive", title: "Login Required", description: "You must log in to watch an ad for a hint."});
        return;
    }
    setIsWatchingAd(true);
    setAdProgress(0);

    const interval = setInterval(() => {
      setAdProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsWatchingAd(false);
            getHint(true); 
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const displayedWord = useMemo(() => {
    if (!wordData) return [];
    const wordChars = wordData.word.split('');
    return wordChars.map((char) => {
      const lowerChar = char.toLowerCase();
      const isGuessed = guessedLetters.correct.includes(lowerChar);
      const isHinted = revealedByHint.includes(lowerChar);
      if (isGuessed || isHinted) {
        return { char, revealed: true };
      }
      return { char, revealed: false };
    });
  }, [wordData, guessedLetters.correct, revealedByHint]);

  const updateFirestoreUser = useCallback(async (scoreGained: number, newLevel: number) => {
    if (user && firestore) {
        const userRef = doc(firestore, "userProfiles", user.uid);
        
        const userDoc = await getDoc(userRef);
        const currentScore = userDoc.data()?.totalScore ?? 0;
        const newTotalScore = currentScore + scoreGained;
        const newRank = getRankForScore(newTotalScore);
        
        const updateData = {
            totalScore: increment(scoreGained),
            highestLevel: newLevel,
            rank: newRank,
            updatedAt: serverTimestamp(),
        };

        updateDoc(userRef, updateData)
          .catch(() => {
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
  
    const isWon = displayedWord.every(item => item.revealed);
    
    if (isWon) {
      setGameState("won");
      playSound('win');
      
      const difficulty = getDifficultyForLevel(level);
      const scoreGained = (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30);
      
      const newLevel = level + 1;
      if (user) {
        updateFirestoreUser(scoreGained, newLevel);
      }
      setScore(s => s + scoreGained);
      
      setTimeout(() => {
        setLevel(newLevel);
        startNewGame(newLevel, wordData.word);
      }, 3000);
  
    } else if (guessedLetters.incorrect.length >= MAX_INCORRECT_TRIES) {
      setGameState("lost");
      playSound('incorrect');
    }
  }, [guessedLetters, wordData, level, playSound, startNewGame, updateFirestoreUser, gameState, displayedWord, hint, revealedByHint, user]);

  const gameContent = () => {
    if (isGameLoading || !wordData) {
        return <div className="text-center p-8 animate-pulse">Loading your next case...</div>;
    }

    const incorrectTriesLeft = MAX_INCORRECT_TRIES - guessedLetters.incorrect.length;
    const allLettersGuessed = wordData && displayedWord.every(item => item.revealed);
    const hintDisabled = isHintLoading || allLettersGuessed || !user || profileLoading;

    const shareText = "I'm playing Definition Detective! Can you beat my high score?";

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-lg">
              <Award className="h-6 w-6 text-primary" />
              Score: <span className="font-bold">{(user ? score : 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-6 w-6 text-yellow-400" />
              Hints: <span className="font-bold">{profileLoading ? '...' : userProfile?.hints ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 text-lg">
              Level: <span className="font-bold">{user ? level : 1}</span>
              </div>
          </div>

          <Card>
              <CardHeader>
              <CardTitle className="text-center">Definition</CardTitle>
              </CardHeader>
              <CardContent>
              <p className="text-center text-lg italic text-muted-foreground p-4 bg-muted/50 rounded-md">{wordData.definition}</p>
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
                      <Button onClick={() => startNewGame(level, wordData?.word)}>
                          <RotateCw className="mr-2 h-4 w-4" /> Retry Level
                      </Button>
                  </div>
              )}
              </Alert>
          ) : (
              <>
              <div className="flex justify-center gap-4">
                  <Button onClick={() => getHint(false)} disabled={hintDisabled}>
                  <Lightbulb className={cn("mr-2 h-4 w-4", isHintLoading && !isWatchingAd && "animate-spin")} />
                  {isHintLoading && !isWatchingAd ? 'Getting Hint...' : 'Use a Hint'}
                  </Button>
                  <Button onClick={handleRewardedAd} disabled={isHintLoading || allLettersGuessed} variant="outline">
                  <Clapperboard className={cn("mr-2 h-4 w-4", isWatchingAd && "animate-spin")} />
                  {isWatchingAd ? 'Loading Ad...' : 'Watch Ad for Hint'}
                  </Button>
              </div>
              {!user && <p className="text-center text-sm text-muted-foreground">Please log in to use hints and save progress.</p>}
              <p className="text-center text-muted-foreground">Incorrect Guesses: {guessedLetters.incorrect.join(', ').toUpperCase()} ({incorrectTriesLeft} left)</p>
              <Keyboard onKeyClick={handleGuess} guessedLetters={guessedLetters} revealedByHint={revealedByHint} />
              </>
          )}

          <div className="mt-12 pt-8 border-t border-dashed">
              <p className="text-sm font-medium flex items-center justify-center gap-2 mb-4 text-muted-foreground"><Share className="h-4 w-4" /> Share The Game!</p>
              <div className="flex justify-center gap-2">
              <ShareButton platform="whatsapp" text={shareText} />
              <ShareButton platform="facebook" text={shareText} />
              <ShareButton platform="x" text={shareText} />
              </div>
          </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto flex flex-col items-center justify-center gap-8 py-8 md:py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl font-headline">
          Definition Detective
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-foreground/80">
          Unscramble the definition and guess the word. Put your vocabulary to the test!
        </p>
      </div>
      {gameContent()}
      
      <AlertDialog open={isWatchingAd}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Your hint is sponsored by...</AlertDialogTitle>
            <AlertDialogDescription>
                This ad will finish shortly. Thanks for your support!
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Video Ad Simulation</p>
            </div>
            <Progress value={adProgress} className="w-full" />
            </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
