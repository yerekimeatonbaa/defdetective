
"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import type { UserProfile } from "@/lib/firebase-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Paintbrush, Lightbulb, CheckCircle, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useTheme } from "@/hooks/use-theme";

const themes = [
  { id: "light", name: "Default Light", description: "The standard light theme." },
  { id: "dark", name: "Default Dark", description: "The standard dark theme." },
  { id: "playful", name: "Playful & Friendly", description: "Fun, energetic, and inviting.", isPurchasable: true },
  { id: "elegant", name: "Elegant & Focused", description: "Calm, minimal, and professional.", isPurchasable: true },
  { id: "night", name: "Immersive Dark", description: "Sleek and modern for focused play.", isPurchasable: true },
  { id: "gradient", name: "Gamified Gradient", description: "Energetic, futuristic, and dynamic.", isPurchasable: true },
];

const hintPacks = [
    { id: "small_hints", name: "5 Hint Pack", amount: 5, description: "A few hints to get you unstuck." },
    { id: "large_hints", name: "25 Hint Pack", amount: 25, description: "Enough hints for the toughest cases." },
];


export default function StorePage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { theme: activeTheme, setTheme } = useTheme();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, "userProfiles", user.uid) : null
  , [firestore, user]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);
  
  const handleThemeAction = async (themeId: string) => {
    if (!userProfileRef) return;
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    const isPurchased = userProfile?.purchasedThemes?.includes(themeId) || !theme.isPurchasable;

    if (isPurchased) {
        // Just apply the theme
        setTheme(themeId as any);
        toast({ title: "Theme Applied", description: `Switched to ${theme.name} theme.` });
    } else {
        // Purchase and apply the theme
        updateDoc(userProfileRef, {
            purchasedThemes: arrayUnion(themeId)
        }).catch(() => {
            const permissionError = new FirestorePermissionError({
                path: userProfileRef.path,
                operation: 'update',
                requestResourceData: { purchasedThemes: arrayUnion(themeId) },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
        
        setTheme(themeId as any);
        toast({ title: "Purchase Successful!", description: `You've unlocked and applied the ${theme.name} theme.` });
    }
  };

  const handlePurchaseHints = async (packId: string, amount: number) => {
    if (!userProfileRef) return;

    const updateData = { hints: increment(amount) };
    updateDoc(userProfileRef, updateData)
      .catch(() => {
            const permissionError = new FirestorePermissionError({
                path: userProfileRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });

    toast({ title: "Purchase Successful!", description: `You've received ${amount} new hints.` });
  };
  
  const loading = authLoading || profileLoading;

  if (loading || !user) {
    return (
        <div className="container mx-auto py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold font-headline">Store</h1>
                <p className="text-muted-foreground mt-2">Purchase items to help your detective work.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Paintbrush /> Cosmetic Themes</h2>
                    <div className="space-y-4">
                        {themes.map(theme => ( <Skeleton key={theme.id} className="h-40 w-full" /> ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Lightbulb /> Hint Packs</h2>
                    <div className="space-y-4">
                        {hintPacks.map(pack => ( <Skeleton key={pack.id} className="h-40 w-full" /> ))}
                    </div>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Store</h1>
        <p className="text-muted-foreground mt-2">Purchase items to help your detective work.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Paintbrush /> Cosmetic Themes</h2>
          <div className="space-y-4">
            {themes.map(theme => {
                const isPurchased = !theme.isPurchasable || userProfile?.purchasedThemes?.includes(theme.id);
                const isActive = activeTheme === theme.id;
                return (
                    <Card key={theme.id} className={isActive ? "border-primary ring-2 ring-primary" : ""}>
                        <CardHeader>
                        <CardTitle>{theme.name}</CardTitle>
                        <CardDescription>{theme.description}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                        <Button onClick={() => handleThemeAction(theme.id)} disabled={isActive}>
                            {isActive ? <><CheckCircle className="mr-2 h-4 w-4" /> Active</> : isPurchased ? <><Palette className="mr-2 h-4 w-4" /> Apply</> : "Purchase"}
                        </Button>
                        </CardFooter>
                    </Card>
                )
            })}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Lightbulb /> Hint Packs</h2>
          <div className="space-y-4">
             {hintPacks.map(pack => (
                <Card key={pack.id}>
                    <CardHeader>
                    <CardTitle>{pack.name}</CardTitle>
                    <CardDescription>{pack.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                    <Button onClick={() => handlePurchaseHints(pack.id, pack.amount)}>Purchase</Button>
                    </CardFooter>
                </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
