"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Problem, Submission, Status } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import useSWR from 'swr';
import api from '@/lib/api';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle, WifiOff } from 'lucide-react';

interface LogMessage {
    stream: 'stdout' | 'stderr' | 'info' | 'error';
    data: string;
}

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center font-mono text-xs bg-muted rounded-md h-96 p-4 text-destructive">
        <AlertTriangle className="h-8 w-8 mb-4" />
        <p className="font-semibold">Failed to load logs</p>
        <p>{message}</p>
    </div>
);

const LogContent = ({ messages }: { messages: LogMessage[] }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        logContainerRef.current?.scrollTo(0, logContainerRef.current.scrollHeight);
    }, [messages]);

    return (
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
    );
};

const UnifiedLogViewer = ({ submissionId, containerId, containerStatus, wsUrl, onStatusUpdate }: {
    submissionId: string;
    containerId: string;
    containerStatus: Status;
    wsUrl: string | null;
    onStatusUpdate: () => void;
}) => {
    const [mode, setMode] = useState<'http' | 'websocket' | 'error'>('http');
    const [httpError, setHttpError] = useState<any>(null);
    const [messages, setMessages] = useState<LogMessage[]>([]);

    const textFetcher = (url: string) => api.get(url, { responseType: 'text' }).then(res => res.data);
    const { data: logText, error: swrError, isLoading } = useSWR(
        mode === 'http' ? `/submissions/${submissionId}/containers/${containerId}/log` : null,
        textFetcher,
        { shouldRetryOnError: false } // Prevent SWR from retrying on its own
    );

    const { readyState, lastMessage } = useWebSocket(wsUrl, {
        shouldReconnect: (closeEvent) => closeEvent.code !== 1000,
        onClose: onStatusUpdate,
        retryOnError: false,
        onOpen: () => setHttpError(null), // Clear previous HTTP error on successful WS connection
    });

    // Effect to handle HTTP result and decide on fallback
    useEffect(() => {
        if (swrError) {
            setHttpError(swrError);
            if (containerStatus === 'Running') {
                setMode('websocket'); // Fallback to WebSocket for running containers
            } else {
                setMode('error'); // Show error for completed containers
            }
        }
    }, [swrError, containerStatus]);

    // Effect to accumulate WebSocket messages
    useEffect(() => {
        if (mode === 'websocket' && lastMessage?.data) {
            try {
                setMessages(prev => [...prev, JSON.parse(lastMessage.data)]);
            } catch { /* ignore malformed messages */ }
        }
    }, [lastMessage, mode]);

    // Determine connection status text for WebSocket
    const connectionStatus = useMemo(() => ({
        [ReadyState.CONNECTING]: "Connecting...",
        [ReadyState.OPEN]: "Live",
        [ReadyState.CLOSING]: "Closing...",
        [ReadyState.CLOSED]: "Disconnected",
        [ReadyState.UNINSTANTIATED]: "Idle",
    }[readyState]), [readyState]);

    if (isLoading) return <Skeleton className="h-96 w-full" />;
    if (mode === 'error') return <ErrorDisplay message={httpError?.message || "Could not connect via HTTP or WebSocket."} />;

    // Display static logs if HTTP request was successful
    if (mode === 'http' && logText) {
        const staticMessages = logText.split('\n').filter(Boolean).map((line: string) => {
            try { return JSON.parse(line); } catch { return { stream: 'stdout', data: line }; }
        });
        return <LogContent messages={staticMessages} />;
    }

    // Display WebSocket logs if in websocket mode
    if (mode === 'websocket') {
        return (
            <div className="relative">
                <div className="absolute top-2 right-6 text-xs font-semibold">{connectionStatus}</div>
                {httpError && readyState === ReadyState.CONNECTING && (
                     <div className="absolute top-8 right-6 text-xs text-muted-foreground p-2 bg-background/80 rounded-md">
                        <p>HTTP failed. Retrying with WebSocket...</p>
                     </div>
                )}
                {(readyState === ReadyState.CLOSED && messages.length === 0) &&
                    <ErrorDisplay message="WebSocket connection failed." />
                }
                <LogContent messages={messages} />
            </div>
        );
    }

    return <Skeleton className="h-96 w-full" />; // Fallback case
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
                                <UnifiedLogViewer
                                    submissionId={submission.id}
                                    containerId={c.id}
                                    containerStatus={c.status}
                                    wsUrl={getWsUrl(c.id)}
                                    onStatusUpdate={onStatusUpdate}
                                />
                            </TabsContent>
                        ))}
                    </Tabs>
                }
            </CardContent>
        </Card>
    );
}