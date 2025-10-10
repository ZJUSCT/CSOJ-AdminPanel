"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from 'swr';
import api from '@/lib/api';
import { User, UserBestScore, ScoreHistoryPoint } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateUserDialog, DeleteUserMenuItem, EditUserDialog, RegisterContestDialog, ResetPasswordDialog } from "@/components/admin/user-actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import Link from "next/link";

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

function UserDetails({ userId }: { userId: string }) {
    const { data: user, isLoading: userLoading } = useSWR<User>(`/users/${userId}`, fetcher);
    const { data: scores, isLoading: scoresLoading } = useSWR<UserBestScore[]>(`/users/${userId}/scores`, fetcher);
    // History is more complex as it's per-contest. We'll fetch it inside the tab.

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
             <TabsList>
                 <TabsTrigger value="scores">Best Scores</TabsTrigger>
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