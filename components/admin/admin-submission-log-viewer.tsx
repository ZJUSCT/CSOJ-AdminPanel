"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Problem, Submission } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import useSWR from 'swr';
import api from '@/lib/api';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface LogMessage {
    stream: 'stdout' | 'stderr' | 'info' | 'error';
    data: string;
}

const StaticLogViewer = ({ submissionId, containerId }: { submissionId: string, containerId: string }) => {
    const textFetcher = (url: string) => api.get(url, { responseType: 'text' }).then(res => res.data);
    const { data: logText, error, isLoading } = useSWR(`/submissions/${submissionId}/containers/${containerId}/log`, textFetcher);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const messages: LogMessage[] = useMemo(() => {
        if (!logText) return [];
        return logText.split('\n').filter(Boolean).map((line: string) => {
            try { return JSON.parse(line); } catch { return { stream: 'stdout', data: line }; }
        });
    }, [logText]);

    useEffect(() => { logContainerRef.current?.scrollTo(0, logContainerRef.current.scrollHeight); }, [messages]);

    return (
        <div ref={logContainerRef} className="font-mono text-xs bg-muted rounded-md h-96 overflow-y-auto p-4">
            {isLoading && <Skeleton className="h-full w-full" />}
            {error && <p className="text-red-400">Failed to load log.</p>}
            {messages.map((msg, index) => (
                <span key={index} className="whitespace-pre-wrap break-all">
                    {msg.stream === 'stderr' || msg.stream === 'error' ? (
                        <span className="text-red-400">{msg.data}</span>
                    ) : msg.stream === 'info' ? (
                        <span className="text-blue-400">{msg.data}</span>
                    ) : (
                        <span className="text-foreground">{msg.data}</span>
                    )}
                </span>
            ))}
        </div>
    );
};

const RealtimeLogViewer = ({ wsUrl, onStatusUpdate }: { wsUrl: string | null, onStatusUpdate: () => void }) => {
    const [messages, setMessages] = useState<LogMessage[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const { readyState, lastMessage } = useWebSocket(wsUrl, {
        shouldReconnect: (closeEvent) => closeEvent.code !== 1000,
        onClose: onStatusUpdate });

    useEffect(() => { setMessages([]); }, [wsUrl]);
    useEffect(() => {
        if (lastMessage?.data) { try { setMessages(prev => [...prev, JSON.parse(lastMessage.data)]); } catch { } }
    }, [lastMessage]);
    useEffect(() => { logContainerRef.current?.scrollTo(0, logContainerRef.current.scrollHeight); }, [messages]);

    const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting...",
        [ReadyState.OPEN]: "Live",
        [ReadyState.CLOSING]: "Closing...",
        [ReadyState.CLOSED]: "Disconnected",
        [ReadyState.UNINSTANTIATED]: "Idle",
    }[readyState];

    return (
        <div className="relative">
            <div className="absolute top-2 right-6 text-xs font-semibold">{connectionStatus}</div>
            <div ref={logContainerRef} className="font-mono text-xs bg-muted rounded-md h-96 overflow-y-auto p-4">
                {messages.map((msg, index) => (
                    <span key={index} className="whitespace-pre-wrap break-all">
                        {msg.stream === 'stderr' || msg.stream === 'error' ? (
                            <span className="text-red-400">{msg.data}</span>
                        ) : msg.stream === 'info' ? (
                            <span className="text-blue-400">{msg.data}</span>
                        ) : (
                            <span className="text-foreground">{msg.data}</span>
                        )}
                    </span>
                ))}
            </div>
        </div>
    );
};

export function AdminSubmissionLogViewer({ submission, problem, onStatusUpdate }: { submission?: Submission, problem?: Problem, onStatusUpdate: () => void }) {
    const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);

    useEffect(() => {
        if (submission?.containers && submission.containers.length > 0) {
            setSelectedContainerId(prev => prev ?? submission.containers[0].id);
            const latestContainer = submission.containers[submission.containers.length - 1];
            if(selectedContainerId !== latestContainer.id && latestContainer.status === "Running") {
                setSelectedContainerId(latestContainer.id);
            }
        }
    }, [submission?.containers, selectedContainerId]);

    if (!submission || !problem) return <Card><CardHeader><CardTitle>Live Log</CardTitle></CardHeader><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>;

    const getWsUrl = (containerId: string | null) => {
        if (!containerId || typeof window === 'undefined') return null;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${wsProtocol}//${host}/api/v1/ws/submissions/${submission.id}/containers/${containerId}/logs`;
    };

    return (
        <Card>
            <CardHeader><CardTitle>Live Log</CardTitle><CardDescription>Real-time output from the judge containers.</CardDescription></CardHeader>
            <CardContent>
                {submission.containers.length === 0 ? <div className="text-muted-foreground">No containers for this submission yet.</div> :
                    <Tabs value={selectedContainerId ?? ""} onValueChange={setSelectedContainerId} className="w-full">
                        <TabsList>
                            {submission.containers.map((c, i) => <TabsTrigger key={c.id} value={c.id}>Step {i + 1}</TabsTrigger>)}
                        </TabsList>
                        {submission.containers.map(c => (
                            <TabsContent key={c.id} value={c.id} className="mt-4">
                                {c.status === 'Running' ?
                                    <RealtimeLogViewer wsUrl={getWsUrl(c.id)} onStatusUpdate={onStatusUpdate} /> :
                                    <StaticLogViewer submissionId={submission.id} containerId={c.id} />
                                }
                            </TabsContent>
                        ))}
                    </Tabs>
                }
            </CardContent>
        </Card>
    );
}