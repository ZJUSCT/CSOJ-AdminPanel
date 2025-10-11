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
import { Badge } from '@/components/ui/badge';
import {
    Bot,
    Calendar,
    Clock,
    Code2,
    Cpu,
    FolderSymlink,
    Hash,
    MemoryStick,
    Network,
    Server,
    Target,
    UploadCloud
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import React from 'react';

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

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start">
        <Icon className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-muted-foreground" />
        <div className="flex-1">
            <p className="text-muted-foreground">{label}</p>
            <div className="font-medium">{value}</div>
        </div>
    </div>
);


function ProblemDetails({ problemId }: { problemId: string }) {
    const { data: problem, isLoading: problemLoading } = useSWR<Problem>(`/problems/${problemId}`, fetcher);
    const { data: submissionsData, isLoading: submissionsLoading } = useSWR<{ items: Submission[] }>(`/submissions?problem_id=${problemId}&limit=100`, fetcher);
    const submissions = submissionsData?.items;

    if (problemLoading || !problem) return <Skeleton className="h-screen w-full" />;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{problem.name}</CardTitle>
                    <CardDescription>ID: <span className="font-mono">{problem.id}</span></CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <InfoItem icon={Calendar} label="Start Time" value={format(new Date(problem.starttime), "Pp")} />
                        <InfoItem icon={Clock} label="End Time" value={format(new Date(problem.endtime), "Pp")} />
                        <InfoItem icon={Server} label="Cluster" value={problem.cluster} />
                        <InfoItem icon={Hash} label="Max Submissions" value={problem.max_submissions > 0 ? problem.max_submissions : "Unlimited"} />
                        <InfoItem icon={Cpu} label="CPU" value={`${problem.cpu} Core(s)`} />
                        <InfoItem icon={MemoryStick} label="Memory" value={formatBytes(problem.memory * 1024 * 1024)} />
                        <InfoItem icon={Target} label="Score Mode" value={<Badge variant="secondary">{problem.score.mode}</Badge>} />
                        <InfoItem icon={UploadCloud} label="Upload Limit" value={`${problem.upload.max_num} file(s), ${formatBytes(problem.upload.max_size * 1024)} max`} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Workflow Steps</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {problem.workflow.map((step, index) => (
                        <Card key={index} className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-lg flex flex-wrap items-center justify-between gap-2">
                                    <span>Step {index + 1}: {step.name}</span>
                                    <div className="flex items-center gap-2">
                                        {step.show && <Badge variant="outline">Logs Visible</Badge>}
                                        {step.root && <Badge variant="destructive">Run as Root</Badge>}
                                        {step.network && <Badge variant="default"><Network className="mr-1 h-3 w-3" /> Network</Badge>}
                                    </div>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-1"><Bot /> Image: <span className="font-mono">{step.image}</span></CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 mb-2"><Code2 /> Commands</h4>
                                    <div className="bg-background p-3 rounded-md font-mono text-xs space-y-1 overflow-x-auto">
                                        {step.steps.map((cmd, cmdIndex) => (
                                            <p key={cmdIndex}><span className="text-muted-foreground">$ </span>{cmd.join(' ')}</p>
                                        ))}
                                    </div>
                                </div>
                                {step.mounts && step.mounts.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold flex items-center gap-2 mb-2"><FolderSymlink /> Mounts</h4>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Source</TableHead>
                                                        <TableHead>Target</TableHead>
                                                        <TableHead>Type</TableHead>
                                                        <TableHead>Read Only</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {step.mounts.map((mount, mountIndex) => (
                                                        <TableRow key={mountIndex}>
                                                            <TableCell className="font-mono">{mount.source}</TableCell>
                                                            <TableCell className="font-mono">{mount.target}</TableCell>
                                                            <TableCell>{mount.type || 'bind'}</TableCell>
                                                            <TableCell>{mount.readonly === false ? 'No' : 'Yes'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Recent Submissions</CardTitle></CardHeader>
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