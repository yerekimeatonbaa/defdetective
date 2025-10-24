"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { UserProfile } from "@/lib/firebase-types";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  
  const usersCollectionRef = useMemoFirebase(() => 
    query(collection(firestore, "userProfiles"), orderBy("totalScore", "desc"))
  , [firestore]);

  const { data: leaderboardData, isLoading } = useCollection<UserProfile>(usersCollectionRef);

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <Trophy className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-4xl font-bold mt-2 font-headline">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">See who's at the top of their game.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="w-[100px] text-right">Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {leaderboardData?.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = currentUser?.uid === entry.id;
                return (
                  <TableRow key={entry.id} className={isCurrentUser ? "bg-primary/10" : ""}>
                    <TableCell className="font-medium text-center text-lg">
                      {rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 animate-pulse">
                          <AvatarImage src={`https://picsum.photos/seed/${entry.id}/40/40`} alt={entry.username} data-ai-hint="profile picture" />
                          <AvatarFallback>{entry.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{entry.username} {isCurrentUser && "(You)"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.rank}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{entry.totalScore.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{entry.highestLevel}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
