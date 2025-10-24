"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target } from "lucide-react";
import type { ImagePlaceholder } from "@/lib/placeholder-images";
import placeholderData from '@/lib/placeholder-images.json';
import { useDoc } from "@/firebase/firestore/use-doc";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/firebase-types";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [avatarImage, setAvatarImage] = useState<ImagePlaceholder | undefined>();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, "userProfiles", user.uid) : null
  , [firestore, user]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    setAvatarImage(placeholderData.placeholderImages.find(p => p.id === "1"));
  }, [user, authLoading, router]);

  const loading = authLoading || profileLoading;

  if (loading || !userProfile) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center gap-8">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="w-full max-w-md">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Avatar className="h-32 w-32 border-4 border-primary animate-pulse">
          {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={userProfile.username} data-ai-hint={avatarImage.imageHint} />}
          <AvatarFallback className="text-4xl">{userProfile.username.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold font-headline">{userProfile.username}</h1>
          <p className="text-muted-foreground">{userProfile.email}</p>
        </div>
      </div>
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
          <CardDescription>Your Definition Detective journey so far.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="font-medium">Total Score</span>
            </div>
            <Badge variant="secondary" className="text-lg">{userProfile.totalScore.toLocaleString()}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-yellow-500" />
              <span className="font-medium">Highest Level</span>
            </div>
            <Badge variant="secondary" className="text-lg">{userProfile.highestLevel}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-green-500" />
              <span className="font-medium">Rank</span>
            </div>
            <Badge variant="secondary" className="text-lg">{userProfile.rank}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
