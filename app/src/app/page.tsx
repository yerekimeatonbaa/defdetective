import GameClient from '@/components/game/game-client';

export default function Home() {
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
                                                                            <GameClient />
                                                                                </div>
                                                                                  );
                                                                                  }
                                                                                  