"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MarkdownViewerProps {
    content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
    // Component mapping to handle links appropriately
    const components = {
        a: ({ node, ...props }: any) => {
            const { href, children, ...rest } = props;
            
            // Handle internal links with Next.js Link for SPA behavior
            if (href && !/^(https?|mailto|tel):/.test(href)) {
                return <Link href={href} {...rest}>{children}</Link>;
            }

            // Handle external links: open in a new tab
            return <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
        }
    };

    return (
        // Apply prose styles for Tailwind Typography plugin
        // prose-tight is a custom theme defined in tailwind.config.ts
        // dark:prose-invert handles dark mode styling
        <div className={cn("prose prose-tight dark:prose-invert max-w-none", "leading-normal")}>
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}