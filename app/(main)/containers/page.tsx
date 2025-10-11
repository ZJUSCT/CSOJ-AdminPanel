"use client"

import useSWR from 'swr';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Container } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SubmissionStatusBadge from '@/components/shared/submission-status-badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

function ContainerDetails({ containerId }: { containerId: string }) {
    const { data: container, isLoading } = useSWR<Container>(`/containers/${containerId}`, fetcher);
    if (isLoading || !container) return <Skeleton className="h-48 w-full" />;

    return (
        <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div><strong>Container ID:</strong> <span className="font-mono">{container.id}</span></div>
                <div><strong>Submission ID:</strong> <Link href={`/submissions?id=${container.submission_id}`} className="font-mono text-primary hover:underline">{container.submission_id}</Link></div>
                <div><strong>User ID:</strong> <Link href={`/users?id=${container.user_id}`} className="font-mono text-primary hover:underline">{container.user_id}</Link></div>
                <div><strong>Status:</strong> <SubmissionStatusBadge status={container.status} /></div>
                <div><strong>Image:</strong> <span className="font-mono">{container.image}</span></div>
                <div><strong>Exit Code:</strong> {container.exit_code}</div>
                <div><strong>Started At:</strong> {container.started_at ? format(new Date(container.started_at), 'Pp') : 'N/A'}</div>
                <div><strong>Finished At:</strong> {container.finished_at ? format(new Date(container.finished_at), 'Pp') : 'N/A'}</div>
            </div>
            <div>
                <strong>Log File Path:</strong>
                <pre className="mt-2 bg-muted p-2 rounded-md font-mono text-xs whitespace-pre-wrap break-all">{container.log_file_path}</pre>
            </div>
        </div>
    )
}

function ContainerList() {
    const [filters, setFilters] = useState({ submission_id: '', user_id: '', status: '' });
    const query = new URLSearchParams(filters).toString();
    const { data: containers, isLoading } = useSWR<Container[]>(`/containers?${query}`, fetcher, { refreshInterval: 5000 });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    if (isLoading) return <Skeleton className="h-96 w-full" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Containers</CardTitle>
                <CardDescription>View all judge containers across the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-2 mb-4">
                    <Input name="submission_id" placeholder="Filter by Submission ID..." onChange={handleFilterChange} />
                    <Input name="user_id" placeholder="Filter by User ID..." onChange={handleFilterChange} />
                    <Input name="status" placeholder="Filter by Status (e.g. Success)..." onChange={handleFilterChange} />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Container ID</TableHead>
                            <TableHead>Submission ID</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {containers?.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-mono">{c.id.substring(0, 8)}</TableCell>
                                <TableCell>
                                    <Link href={`/submissions?id=${c.submission_id}`} className="font-mono text-primary hover:underline">
                                        {c.submission_id.substring(0, 8)}
                                    </Link>
                                </TableCell>
                                <TableCell>{c.image}</TableCell>
                                <TableCell><SubmissionStatusBadge status={c.status} /></TableCell>
                                <TableCell>{format(new Date(c.CreatedAt), 'Pp')}</TableCell>
                                <TableCell>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">Details</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-3xl">
                                            <DialogHeader>
                                                <DialogTitle>Container Details</DialogTitle>
                                            </DialogHeader>
                                            <ContainerDetails containerId={c.id} />
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function ContainersPage() {
    return (
        <Suspense fallback={<Skeleton className="h-screen w-full" />}>
            <ContainerList />
        </Suspense>
    );
}