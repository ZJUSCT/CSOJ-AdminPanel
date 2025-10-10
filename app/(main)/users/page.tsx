"use client"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from 'swr';
import api from '@/lib/api';
import { User, UserBestScore, ScoreHistoryPoint } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, History } from "lucide-react"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateUserDialog, DeleteUserMenuItem, EditUserDialog, RegisterContestDialog, ResetPasswordDialog } from "@/components/admin/user-actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import Link from "next/link";
import { Input } from "@/components/ui/input";

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

function UserList() {
  const { data: users, error, isLoading, mutate } = useSWR<User[]>('/users', fetcher);

  if (isLoading) return <Card>
    <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
    <CardContent><Skeleton className="h-64 w-full" /></CardContent>
  </Card>;
  if (error) return <div>Failed to load users.</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage all user accounts.</CardDescription>
          </div>
          <CreateUserDialog onUserCreated={mutate} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Nickname</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map(user => (
              <TableRow key={user.id}>
                <TableCell><Link href={`/users?id=${user.id}`} className="font-mono text-primary hover:underline">{user.id}</Link></TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.nickname}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}><EditUserDialog user={user} onUserUpdated={mutate} /></DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}><ResetPasswordDialog userId={user.id} /></DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}><RegisterContestDialog userId={user.id} /></DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DeleteUserMenuItem userId={user.id} onUserDeleted={mutate} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function UserContestHistory({ userId }: { userId: string }) {
    const [contestId, setContestId] = useState('');
    const [submittedContestId, setSubmittedContestId] = useState('');

    const { data: history, isLoading } = useSWR<ScoreHistoryPoint[]>(
        submittedContestId ? `/users/${userId}/history?contest_id=${submittedContestId}` : null,
        fetcher
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedContestId(contestId);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Contest Score History</CardTitle>
                <CardDescription>View a user's score progression over time for a specific contest.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                    <Input
                        placeholder="Enter Contest ID..."
                        value={contestId}
                        onChange={(e) => setContestId(e.target.value)}
                    />
                    <Button type="submit">Fetch History</Button>
                </form>
                {isLoading && <Skeleton className="h-48 w-full" />}
                {history && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Problem ID</TableHead>
                                <TableHead>Total Score After Change</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((h, i) => (
                                <TableRow key={i}>
                                    <TableCell>{format(new Date(h.time), 'Pp')}</TableCell>
                                    <TableCell>{h.problem_id}</TableCell>
                                    <TableCell>{h.score}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                 {history?.length === 0 && <p className="text-muted-foreground text-center p-4">No history found for this contest.</p>}
            </CardContent>
        </Card>
    );
}


function UserDetails({ userId }: { userId: string }) {
    const { data: user, isLoading: userLoading } = useSWR<User>(`/users/${userId}`, fetcher);
    const { data: scores, isLoading: scoresLoading } = useSWR<UserBestScore[]>(`/users/${userId}/scores`, fetcher);

    if (userLoading) return <Skeleton className="h-96 w-full" />;

    return (
        <div className="space-y-6">
          <Card>
             <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatar_url} alt={user?.nickname} />
                  <AvatarFallback>{user ? getInitials(user.nickname) : '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user?.nickname}</CardTitle>
                  <CardDescription>@{user?.username} ({user?.id})</CardDescription>
                </div>
             </CardHeader>
          </Card>
          <Tabs defaultValue="scores">
             <TabsList className="grid w-full grid-cols-2">
                 <TabsTrigger value="scores">Best Scores</TabsTrigger>
                <TabsTrigger value="history"><History/> Contest History</TabsTrigger>
             </TabsList>
             <TabsContent value="scores" className="mt-4">
                 <Card>
                    <CardHeader><CardTitle>Best Scores by Problem</CardTitle></CardHeader>
                    <CardContent>
                      {scoresLoading ? <Skeleton className="h-48 w-full" /> :
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Problem ID</TableHead>
                              <TableHead>Contest ID</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Submission ID</TableHead>
                              <TableHead>Attempts</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {scores?.map(s => (
                              <TableRow key={s.ID}>
                                <TableCell><Link href={`/problems?id=${s.ProblemID}`} className="text-primary hover:underline">{s.ProblemID}</Link></TableCell>
                                <TableCell><Link href={`/contests?id=${s.ContestID}`} className="text-primary hover:underline">{s.ContestID}</Link></TableCell>
                                <TableCell>{s.Score}</TableCell>
                                <TableCell><Link href={`/submissions?id=${s.SubmissionID}`} className="font-mono text-primary hover:underline">{s.SubmissionID.substring(0,8)}...</Link></TableCell>
                                <TableCell>{s.SubmissionCount}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      }
                    </CardContent>
                 </Card>
             </TabsContent>
                <TabsContent value="history" className="mt-4">
                    <UserContestHistory userId={userId} />
                </TabsContent>
          </Tabs>
        </div>
    )
}


function UsersPageContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('id')

  if (userId) {
    return <UserDetails userId={userId} />
  }

  return <UserList />
}

export default function UsersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <UsersPageContent />
    </Suspense>
  );
}