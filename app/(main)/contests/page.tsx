"use client"
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Contest, LeaderboardEntry, Problem, TrendEntry } from '@/lib/types';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Calendar, Clock, Trophy, BarChart3, List, MoreVertical, Edit, Trash, PlusCircle, Files, Megaphone, Save, X, GripVertical } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EchartsTrendChart from '@/components/admin/echarts-trend-chart';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContestFormDialog, DeleteContestButton } from '@/components/admin/contest-actions';
import { DeleteProblemButton, ProblemFormDialog } from '@/components/admin/problem-actions';
import { useRouter } from 'next/navigation';
import { AssetManager } from '@/components/admin/asset-manager';
import { AnnouncementManager } from '@/components/admin/announcement-manager';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '@/components/shared/strict-mode-droppable';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

function ContestList() {
    const { data: contests, error, isLoading, mutate } = useSWR<Record<string, Contest>>('/contests', fetcher);
    const { mutate: problemsMutate } = useSWRConfig();

    if (error) return <div>Failed to load contests.</div>;

    const onSuccess = () => {
        mutate();
        problemsMutate('/problems');
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Contests</CardTitle>
                    <CardDescription>All contests loaded in the system.</CardDescription>
                </div>
                <ContestFormDialog onSuccess={onSuccess} trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Create Contest</Button>} />
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div> :
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Object.values(contests || {}).map(contest => (
                            <Card key={contest.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-xl">{contest.name}</CardTitle>
                                            <CardDescription>ID: {contest.id}</CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <ContestFormDialog contest={contest} onSuccess={onSuccess} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>} />
                                                <DeleteContestButton contest={contest} onSuccess={onSuccess} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>} />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>{format(new Date(contest.starttime), 'Pp')}</span></div>
                                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>{format(new Date(contest.endtime), 'Pp')}</span></div>
                                </CardContent>
                                <CardFooter>
                                    <Link href={`/contests?id=${contest.id}`} passHref><Button className="w-full">Manage Contest</Button></Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                }
            </CardContent>
        </Card>
    );
}

function ContestTrendView({ contest }: { contest: Contest }) {
    const [numUsers, setNumUsers] = useState(20);
    const { data: leaderboardData, isLoading: leaderboardLoading } = useSWR<LeaderboardEntry[]>(`/contests/${contest.id}/leaderboard`, fetcher);
    const { data: trendData, isLoading: trendLoading } = useSWR<TrendEntry[]>(`/contests/${contest.id}/trend?maxnum=${numUsers}`, fetcher, { refreshInterval: 30000 });
    const maxUsers = leaderboardData?.length ?? 100;
    
    if (leaderboardLoading) return <Skeleton className="h-[550px] w-full" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Score Trend</CardTitle>
                <CardDescription>Drag the slider to adjust the number of top users shown in the chart.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-4 mb-4 p-2 bg-muted rounded-md">
                    <Label htmlFor="user-slider" className="min-w-fit text-sm">Top Users: <span className="font-bold text-primary text-base">{numUsers}</span></Label>
                    <input id="user-slider" type="range" min="1" max={maxUsers} value={numUsers} onChange={(e) => setNumUsers(Number(e.target.value))} className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer dark:bg-primary/30" />
                </div>
                <div className="h-[500px]">
                    {trendLoading ? <Skeleton className="h-full w-full" /> : 
                     trendData ? 
                        <EchartsTrendChart 
                            trendData={trendData}
                            contestStartTime={contest.starttime}
                            contestEndTime={contest.endtime}
                        /> : 
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground">Could not load trend data.</div>}
                </div>
            </CardContent>
        </Card>
    )
}


function ContestLeaderboard({ contestId }: { contestId: string }) {
    const { data: contest } = useSWR<Contest>(`/contests/${contestId}`, fetcher);
    const { data: leaderboard, isLoading } = useSWR<LeaderboardEntry[]>(`/contests/${contestId}/leaderboard`, fetcher, { refreshInterval: 15000 });

    if (isLoading || !contest) return <Skeleton className="h-64 w-full" />;
    if (!leaderboard || leaderboard.length === 0) return <p className="text-muted-foreground text-center py-8">No scores recorded yet.</p>;

    return (
        <Card>
            <CardHeader><CardTitle>Leaderboard</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead><TableHead>User</TableHead>
                            {contest.problem_ids.map((id, index) => <TableHead key={id} className="text-center"><Link href={`/problems?id=${id}`} className="hover:underline">P{index + 1}</Link></TableHead>)}
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

function ContestProblemsView({ contest, allProblems, contests, onSuccess }: { contest: Contest, allProblems: Record<string, Problem>, contests: Contest[], onSuccess: () => void }) {
    const initialProblems = useMemo(() => contest.problem_ids.map(id => allProblems[id]).filter(Boolean), [contest.problem_ids, allProblems]);
    const [orderedProblems, setOrderedProblems] = useState<Problem[]>(initialProblems);
    const [isOrderChanged, setIsOrderChanged] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setOrderedProblems(contest.problem_ids.map(id => allProblems[id]).filter(Boolean));
        setIsOrderChanged(false);
    }, [contest, allProblems]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        const newProblems = Array.from(orderedProblems);
        const [reorderedItem] = newProblems.splice(source.index, 1);
        newProblems.splice(destination.index, 0, reorderedItem);

        setOrderedProblems(newProblems);
        setIsOrderChanged(true);
    };

    const handleCancel = () => {
        setOrderedProblems(initialProblems);
        setIsOrderChanged(false);
    };

    const handleSaveOrder = async () => {
        const problem_ids = orderedProblems.map(p => p.id);
        try {
            await api.put(`/contests/${contest.id}/problems/order`, { problem_ids });
            toast({ title: "Problem order saved!" });
            setIsOrderChanged(false);
            onSuccess();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Failed to save order', description: err.response?.data?.message });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Problems in Contest</CardTitle>
                    <CardDescription>Drag and drop the cards to change the problem order.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                     {isOrderChanged && (
                        <>
                            <Button variant="outline" onClick={handleCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                            <Button onClick={handleSaveOrder}><Save className="mr-2 h-4 w-4" /> Save Order</Button>
                        </>
                    )}
                    <ProblemFormDialog contestId={contest.id} contests={contests} onSuccess={onSuccess} trigger={<Button><PlusCircle className="mr-2 h-4 w-4" /> Add Problem</Button>} />
                </div>
            </CardHeader>
            <CardContent>
                {orderedProblems.length === 0 ? <p className="text-muted-foreground text-center py-8">No problems added to this contest yet.</p> :
                    <DragDropContext onDragEnd={onDragEnd}>
                        <StrictModeDroppable droppableId="problems">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                    {orderedProblems.map((problem, index) => (
                                        <Draggable key={problem.id} draggableId={problem.id} index={index}>
                                            {(provided) => (
                                                <Card
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="flex items-center p-4"
                                                >
                                                    <div {...provided.dragHandleProps} className="p-2 cursor-grab text-muted-foreground">
                                                        <GripVertical className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <Link href={`/problems?id=${problem.id}`} className="hover:underline font-semibold">{problem.name}</Link>
                                                                <p className="font-mono text-xs text-muted-foreground">{problem.id}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical /></Button></DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <ProblemFormDialog problem={problem} contestId={contest.id} contests={contests} onSuccess={onSuccess} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>} />
                                                                        <DeleteProblemButton problem={problem} onSuccess={onSuccess} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>} />
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </StrictModeDroppable>
                    </DragDropContext>
                }
            </CardContent>
        </Card>
    )
}

function ContestDetailView({ contestId, view }: { contestId: string, view: string }) {
    const { mutate: globalMutate } = useSWRConfig();
    const router = useRouter();

    const { data: contest, isLoading, mutate: mutateContest } = useSWR<Contest>(`/contests/${contestId}`, fetcher);
    const { data: allProblems, isLoading: problemsLoading } = useSWR<Record<string, Problem>>('/problems', fetcher);
    const { data: allContests, isLoading: contestsLoading } = useSWR<Record<string, Contest>>('/contests', fetcher);

    const onSuccess = () => {
        globalMutate(`/contests`);
        globalMutate(`/problems`);
        mutateContest();
    };
    
    const onContestDelete = () => {
        globalMutate('/contests');
        router.push('/contests');
    }

    if (isLoading || !contest || problemsLoading || contestsLoading || !allProblems || !allContests) return <Skeleton className="h-96 w-full" />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">{contest.name}</h1>
                <div className="flex items-center gap-2">
                    <ContestFormDialog contest={contest} onSuccess={onSuccess} trigger={<Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>}/>
                    <DeleteContestButton contest={contest} onSuccess={onContestDelete} trigger={<Button variant="destructive"><Trash className="mr-2 h-4 w-4" /> Delete</Button>}/>
                </div>
            </div>
            <Tabs value={view} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="problems" asChild><Link href={`/contests?id=${contestId}&view=problems`}><List className="mr-2 h-4 w-4" />Problems</Link></TabsTrigger>
                    <TabsTrigger value="announcements" asChild><Link href={`/contests?id=${contestId}&view=announcements`}><Megaphone className="mr-2 h-4 w-4" />Announcements</Link></TabsTrigger>
                    <TabsTrigger value="assets" asChild><Link href={`/contests?id=${contestId}&view=assets`}><Files className="mr-2 h-4 w-4" />Assets</Link></TabsTrigger>
                    <TabsTrigger value="leaderboard" asChild><Link href={`/contests?id=${contestId}&view=leaderboard`}><Trophy className="mr-2 h-4 w-4" />Leaderboard</Link></TabsTrigger>
                    <TabsTrigger value="trend" asChild><Link href={`/contests?id=${contestId}&view=trend`}><BarChart3 className="mr-2 h-4 w-4" />Trend</Link></TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="mt-6">
                {view === 'problems' && <ContestProblemsView contest={contest} allProblems={allProblems} contests={Object.values(allContests)} onSuccess={onSuccess} />}
                {view === 'announcements' && <AnnouncementManager contestId={contestId} />}
                {view === 'assets' && <AssetManager assetType="contest" assetId={contestId} />}
                {view === 'leaderboard' && <ContestLeaderboard contestId={contestId} />}
                {view === 'trend' && <ContestTrendView contest={contest} />}
            </div>
        </div>
    );
}

function ContestsPageContent() {
    const searchParams = useSearchParams();
    const contestId = searchParams.get('id');
    const view = searchParams.get('view') || 'problems';
    if (contestId) return <ContestDetailView contestId={contestId} view={view} />;
    return <ContestList />;
}

export default function ContestsPage() {
    return (<Suspense fallback={<Skeleton className="w-full h-96" />}><ContestsPageContent /></Suspense>);
}