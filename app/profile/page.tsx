
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Edit, Save, Trash2, X } from "lucide-react";
import type { ImagePlaceholder } from "@/lib/placeholder-images";
import placeholderData from '@/lib/placeholder-images.json';
import { useDoc } from "@/firebase/firestore/use-doc";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/firebase-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, loading: authLoading, updateUsername, deleteAccount } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [avatarImage, setAvatarImage] = useState<ImagePlaceholder | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, "userProfiles", user.uid) : null
  , [firestore, user]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    if (userProfile) {
      setNewUsername(userProfile.username);
    }
  }, [userProfile]);

  useEffect(() => {
    setAvatarImage(placeholderData.placeholderImages.find(p => p.id === "1"));
  }, []);

  const handleSave = async () => {
    if (!newUsername || newUsername.trim() === "") {
        toast({
            variant: "destructive",
            title: "Invalid Username",
            description: "Username cannot be empty."
        });
        return;
    }
    await updateUsername(newUsername);
    setIsEditing(false);
    toast({
        title: "Profile Updated",
        description: "Your username has been successfully changed."
    })
  };
  
  const handleDeleteAccount = async () => {
    await deleteAccount();
    toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted."
    });
    router.push("/signup");
  };

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
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
           <div className="flex justify-between items-center">
             <CardTitle>Your Profile</CardTitle>
              {!isEditing && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Edit className="h-5 w-5" />
                </Button>
              )}
           </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Avatar className="h-32 w-32 border-4 border-primary">
                {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={userProfile.username} data-ai-hint={avatarImage.imageHint} />}
                <AvatarFallback className="text-4xl">{userProfile.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                {isEditing ? (
                  <div className="flex gap-2 items-center">
                    <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="text-2xl font-bold font-headline h-auto p-1 text-center" />
                    <Button size="icon" onClick={handleSave}><Save className="h-5 w-5"/></Button>
                    <Button size="icon" variant="outline" onClick={() => {setIsEditing(false); setNewUsername(userProfile.username)}}><X className="h-5 w-5"/></Button>
                  </div>
                ) : (
                  <h1 className="text-4xl font-bold font-headline">{userProfile.username}</h1>
                )}
                <p className="text-muted-foreground">{userProfile.email}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Stats</h3>
              <div className="space-y-4">
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
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Account</h3>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
