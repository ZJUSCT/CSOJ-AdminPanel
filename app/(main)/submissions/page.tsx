"use client";
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { Submission, Problem, PaginatedResponse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import SubmissionStatusBadge from '@/components/shared/submission-status-badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AdminSubmissionLogViewer } from '@/components/admin/admin-submission-log-viewer';
import { Clock, Code, Hash, Layers, RefreshCcw, Server, Trash2, User, XCircle, CheckCircle, Ban, Edit, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UpdateSubmissionDialog } from '@/components/admin/submission-actions';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { SubmissionTableActions } from '@/components/admin/submission-table-actions';
import { RefreshIntervalSelector } from '@/components/shared/refresh-interval-selector';
import { Separator } from '@/components/ui/separator';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

function SubmissionsList() {
	const [page, setPage] = useState(1);
	const [filters, setFilters] = useState({ user_query: '', problem_id: '', status: '' });
	const [refreshInterval, setRefreshInterval] = useState(1000);

	const queryParams = new URLSearchParams({
		...filters,
		page: page.toString(),
		limit: '20'
	});
	const query = queryParams.toString();

	const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Submission>>(
		`/submissions?${query}`,
		fetcher,
		{ refreshInterval: refreshInterval }
	);

	const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilters({ ...filters, [e.target.name]: e.target.value });
		setPage(1); // Reset to page 1 on filter change
	};

	const submissions = data?.items;

	return (
		<Card>
			<CardHeader>
				<CardTitle>All Submissions</CardTitle>
				<CardDescription>Browse and filter all submissions in the system.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col md:flex-row gap-2 justify-between">
					<div className="flex flex-col sm:flex-row gap-2 flex-grow">
						<Input name="user_query" placeholder="Filter by User" onChange={handleFilterChange} />
						<Input name="problem_id" placeholder="Filter by Problem ID" onChange={handleFilterChange} />
						<Input name="status" placeholder="Filter by Status (e.g. Success)" onChange={handleFilterChange} />
					</div>
					<RefreshIntervalSelector
						defaultValue={refreshInterval}
						onIntervalChange={setRefreshInterval}
					/>
				</div>
				{isLoading && !data ? <Skeleton className="h-64 w-full" /> :
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[100px]">ID</TableHead>
									<TableHead>Problem</TableHead>
									<TableHead>User</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Score</TableHead>
									<TableHead>Performance</TableHead>
									<TableHead>Date</TableHead>
									<TableHead className="text-right w-[240px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{submissions?.map(s => (
									<TableRow key={s.id}>
										<TableCell><Link href={`/submissions?id=${s.id}`} className="font-mono text-primary hover:underline">{s.id.substring(0, 8)}</Link></TableCell>
										<TableCell><Link href={`/problems?id=${s.problem_id}`} className="hover:underline">{s.problem_id}</Link></TableCell>
										<TableCell><Link href={`/users?id=${s.user_id}`} className="hover:underline">{s.user.nickname}</Link></TableCell>
										<TableCell><SubmissionStatusBadge status={s.status} /></TableCell>
										<TableCell>{s.score}</TableCell>
										<TableCell>{s.performance?.toFixed(4)}</TableCell>
										<TableCell>{format(new Date(s.CreatedAt), "Pp")}</TableCell>
										<TableCell className="text-right">
											<SubmissionTableActions submission={s} mutate={mutate} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<PaginationControls
							currentPage={data?.current_page ?? 1}
							totalPages={data?.total_pages ?? 1}
							onPageChange={setPage}
						/>
					</>
				}
			</CardContent>
		</Card>
	);
}

function SubmissionDetails({ submissionId }: { submissionId: string }) {
	const { toast } = useToast();
	const { data: submission, mutate } = useSWR<Submission>(`/submissions/${submissionId}`, fetcher, {
		refreshInterval: (data) => (data?.status === 'Queued' || data?.status === 'Running' ? 2000 : 0),
	});
	const { data: problem } = useSWR<Problem>(submission ? `/problems/${submission.problem_id}` : null, fetcher);

	const handleAction = async (action: 'rejudge' | 'interrupt' | 'delete' | 'validity', payload?: any) => {
		const endpoint = action === 'validity' ? `/submissions/${submissionId}/validity` : `/submissions/${submissionId}/${action}`;
		const method = action === 'validity' ? 'patch' : 'post';
		try {
			const apiCall = action === 'delete' ? api.delete(endpoint) : api[method](endpoint, payload);
			await apiCall;
			toast({ title: 'Success', description: `Action '${action}' completed successfully.` });
			mutate();
		} catch (err: any) {
			toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || `Failed to perform action '${action}'.` });
		}
	};

	if (!submission) return <Skeleton className="h-screen w-full" />;

	return (
		<div className="grid gap-6 lg:grid-cols-3 items-stretch">
			<div className="lg:col-span-2 flex flex-col h-full">
				<div className="flex flex-col h-full">
					<AdminSubmissionLogViewer submission={submission} problem={problem} onStatusUpdate={mutate} />
				</div>
			</div>

			<div className="flex flex-col h-full">
				<Card className="flex flex-col h-full">
					<CardHeader><CardTitle>Submission Info</CardTitle></CardHeader>
					<CardContent className="flex-1 space-y-4 text-sm overflow-y-auto">
						<div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><Hash />Status</span><SubmissionStatusBadge status={submission.status} /></div>
						<div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2">Validity</span><span>{submission.is_valid ? 'Valid' : 'Invalid'}</span></div>
						<div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><Clock />Submitted</span><span>{formatDistanceToNow(new Date(submission.CreatedAt), { addSuffix: true })}</span></div>
						<div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><Code />Problem</span><Link href={`/problems?id=${submission.problem_id}`} className="text-primary hover:underline">{submission.problem_id}</Link></div>
						<div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><User />User</span><Link href={`/users?id=${submission.user_id}`} className="text-primary hover:underline">{submission.user.nickname}</Link></div>
						<div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><Layers />Cluster</span><span>{submission.cluster}</span></div>
						<div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><Server />Node</span><span>{submission.node || 'N/A'}</span></div>

						<Separator className="my-4" />

						<div className="space-y-2">
							<h3 className="font-semibold tracking-tight">Admin Actions</h3>
							<div className="grid grid-cols-2 gap-2">
								<Button onClick={() => handleAction('rejudge')}><RefreshCcw /> Rejudge</Button>
								<Button asChild variant="outline">
									<Link href={`/api/v1/submissions/${submissionId}/content`} download>
										<Download /> Download Files
									</Link>
								</Button>
								<Button variant="destructive" onClick={() => handleAction('interrupt')} disabled={submission.status !== 'Queued' && submission.status !== 'Running'}><XCircle /> Interrupt</Button>
								{submission.is_valid ? (
									<Button variant="outline" onClick={() => handleAction('validity', { is_valid: false })}><Ban /> Mark Invalid</Button>
								) : (
									<Button variant="outline" onClick={() => handleAction('validity', { is_valid: true })}><CheckCircle /> Mark Valid</Button>
								)}
								<Button variant="destructive" onClick={() => { if (confirm('Are you sure? This will delete the submission and its content permanently.')) handleAction('delete'); }}><Trash2 /> Delete</Button>
								<UpdateSubmissionDialog submission={submission} onSubmissionUpdated={mutate}>
									<Button variant="outline" className="w-full"><Edit /> Manual Override</Button>
								</UpdateSubmissionDialog>
							</div>
						</div>

						{submission.info && Object.keys(submission.info).length > 0 && (
							<>
								<Separator className="my-4" />
								<div className="space-y-2">
									<h3 className="font-semibold tracking-tight">Judge Info</h3>
									<pre className="p-4 bg-muted rounded-md text-xs overflow-auto">
										{JSON.stringify(submission.info, null, 2)}
									</pre>
									<p className="text-xs text-muted-foreground">This is the raw JSON output from the final step of the judging process.</p>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function SubmissionsPageContent() {
	const searchParams = useSearchParams();
	const submissionId = searchParams.get('id');

	if (submissionId) {
		return <SubmissionDetails submissionId={submissionId} />;
	}
	return <SubmissionsList />;
}

export default function SubmissionsPage() {
	return (
		<Suspense fallback={<Skeleton className="h-screen w-full" />}>
			<SubmissionsPageContent />
		</Suspense>
	);
}