"use client";
import { SWRConfig } from 'swr';
import { useToast } from '@/hooks/use-toast';

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
    const { toast } = useToast();
    return (
        <SWRConfig
            value={{
                revalidateOnFocus: true,
                errorRetryCount: 2,
                onError: (error) => {
                    toast({
                        variant: "destructive",
                        title: "API Error",
                        description: error.response?.data?.message || error.message || "An unknown error occurred",
                    })
                }
            }}
        >
            {children}
        </SWRConfig>
    );
};