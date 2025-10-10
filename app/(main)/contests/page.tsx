"use client"
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import useSWR from 'swr';
import { Contest, Problem, LeaderboardEntry, TrendEntry } from '@/lib/types';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Calendar, Clock, BookOpen, Trophy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
// Note: EchartsTrendChart and UserProfileCard would need to be created/copied if desired for admin panel
// For this implementation, we will stick to the basic leaderboard.

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

function ContestList() {
    const { data: contests, error, isLoading } = useSWR<Record<string, Contest>>('/contests', fetcher);

    if (isLoading) return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
            ))}
        </div>
    );
    if (error) return <div>Failed to load contests.</div>;
    if (!contests || Object.keys(contests).length === 0) return <div>No contests found.</div>;

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.values(contests).map(contest => (
                <Card key={contest.id}>
                    <CardHeader>
                        <CardTitle className="text-xl">{contest.name}</CardTitle>
                        <CardDescription>ID: {contest.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>{format(new Date(contest.starttime), 'Pp')}</span></div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>{format(new Date(contest.endtime), 'Pp')}</span></div>
                    </CardContent>
                    <CardFooter>
                        <Link href={`/contests?id=${contest.id}`} passHref><Button>View Details</Button></Link>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

function ContestLeaderboard({ contestId }: { contestId: string }) {
    const { data: contest } = useSWR<Contest>(`/contests/${contestId}`, fetcher);
    const { data: leaderboard, isLoading } = useSWR<LeaderboardEntry[]>(`/contests/${contestId}/leaderboard`, fetcher, { refreshInterval: 15000 });

    if (isLoading) return <Skeleton className="h-64 w-full" />;
    if (!leaderboard || leaderboard.length === 0) return <p>No scores recorded yet.</p>;
    if (!contest) return <p>Could not load contest details for header.</p>;

    return (
        <Card>
            <CardHeader><CardTitle>Leaderboard</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>User</TableHead>
                            {contest.problem_ids.map((id, index) => (
                                <TableHead key={id} className="text-center"><Link href={`/problems?id=${id}`} className="hover:underline">P{index + 1}</Link></TableHead>
                            ))}
                            <TableHead className="text-right">Total Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboard.map((entry, index) => (
                            <TableRow key={entry.user_id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell><Link href={`/users?id=${entry.user_id}`} className="hover:underline">{entry.nickname}</Link></TableCell>
                                {contest.problem_ids.map(pid => <TableCell key={pid} className="text-center">{entry.problem_scores[pid] ?? '–'}</TableCell>)}
                                <TableCell className="text-right font-bold">{entry.total_score}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function ContestDetailView({ contestId, view }: { contestId: string, view: string }) {
    const { data: contest, isLoading } = useSWR<Contest>(`/contests/${contestId}`, fetcher);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-64" /> : contest?.name}</h1>
            </div>
            <Tabs value={view} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="problems" asChild><Link href={`/contests?id=${contestId}&view=problems`}>Problems</Link></TabsTrigger>
                    <TabsTrigger value="leaderboard" asChild><Link href={`/contests?id=${contestId}&view=leaderboard`}>Leaderboard</Link></TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="mt-6">
                {view === 'leaderboard' ? <ContestLeaderboard contestId={contestId} /> : (
                  <Card>
                     <CardHeader><CardTitle>Problems in Contest</CardTitle></CardHeader>
                     <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                        {contest?.problem_ids.map(problemId => (
                           <Card key={problemId}>
                             <CardHeader><CardTitle className="text-base">{problemId}</CardTitle></CardHeader>
                             <CardFooter><Link href={`/problems?id=${problemId}`}><Button size="sm">View Problem</Button></Link></CardFooter>
                           </Card>
                        ))}
                     </CardContent>
                  </Card>
                )}
            </div>
        </div>
    );
}

function ContestsPageContent() {
    const searchParams = useSearchParams();
    const contestId = searchParams.get('id');
    const view = searchParams.get('view') || 'problems';

    if (contestId) {
        return <ContestDetailView contestId={contestId} view={view} />;
    }

    return <ContestList />;
}

export default function ContestsPage() {
    return (
        <Suspense fallback={<Skeleton className="w-full h-96" />}>
            <ContestsPageContent />
        </Suspense>
    );
}