"use client"
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { Problem, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Suspense } from 'react';
import SubmissionStatusBadge from '@/components/shared/submission-status-badge';
import { format } from 'date-fns';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

function ProblemList() {
  const { data: problems, isLoading } = useSWR<Record<string, Problem>>('/problems', fetcher);
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Problems</CardTitle>
        <CardDescription>List of all problems loaded in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Cluster</TableHead></TableRow></TableHeader>
          <TableBody>
            {problems && Object.values(problems).map(p => (
              <TableRow key={p.id}>
                <TableCell><Link href={`/problems?id=${p.id}`} className="font-mono text-primary hover:underline">{p.id}</Link></TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.cluster}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ProblemDetails({ problemId }: { problemId: string }) {
  const { data: problem, isLoading: problemLoading } = useSWR<Problem>(`/problems/${problemId}`, fetcher);
  const { data: submissions, isLoading: submissionsLoading } = useSWR<Submission[]>(`/submissions?problem_id=${problemId}`, fetcher);

  if (problemLoading) return <Skeleton className="h-screen w-full" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{problem?.name}</CardTitle>
          <CardDescription>ID: {problem?.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
            {JSON.stringify(problem, null, 2)}
          </pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Submissions for this Problem</CardTitle></CardHeader>
        <CardContent>
          {submissionsLoading ? <Skeleton className="h-48 w-full" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>User</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {submissions?.map(s => (
                  <TableRow key={s.id}>
                    <TableCell><Link href={`/submissions?id=${s.id}`} className="font-mono text-primary hover:underline">{s.id.substring(0, 8)}...</Link></TableCell>
                    <TableCell><Link href={`/users?id=${s.user.id}`} className="hover:underline">{s.user.nickname}</Link></TableCell>
                    <TableCell><SubmissionStatusBadge status={s.status} /></TableCell>
                    <TableCell>{s.score}</TableCell>
                    <TableCell>{format(new Date(s.CreatedAt), "Pp")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProblemsPageContent() {
  const searchParams = useSearchParams();
  const problemId = searchParams.get('id');

  if (problemId) {
    return <ProblemDetails problemId={problemId} />;
  }
  return <ProblemList />;
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <ProblemsPageContent />
    </Suspense>
  );
}