'use client';

import React from 'react';

interface AiMarkdownMessageProps {
    content: string;
    role?: 'user' | 'assistant' | 'system' | string;
    className?: string;
}

/**
 * Parses inline markdown formatted text (bold, italic, code, links).
 */
function renderInlineContent(text: string): React.ReactNode[] {
    // Regex matches ***bold italic***, **bold**, *italic*, `code`
    const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith('***') && part.endsWith('***')) {
            const inner = part.slice(3, -3);
            return (
                <strong key={index} className="font-semibold text-foreground">
                    <em className="italic text-foreground-secondary">{inner}</em>
                </strong>
            );
        }

        if (part.startsWith('**') && part.endsWith('**')) {
            const inner = part.slice(2, -2);
            return (
                <strong key={index} className="font-semibold text-foreground">
                    {inner}
                </strong>
            );
        }

        if (part.startsWith('*') && part.endsWith('*')) {
            const inner = part.slice(1, -1);
            return (
                <em key={index} className="italic text-foreground-secondary">
                    {inner}
                </em>
            );
        }

        if (part.startsWith('`') && part.endsWith('`')) {
            const inner = part.slice(1, -1);
            return (
                <code
                    key={index}
                    className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-accent font-mono text-[11px]"
                >
                    {inner}
                </code>
            );
        }

        return <span key={index}>{part}</span>;
    });
}

/**
 * Beautiful, minimalist Markdown parser and renderer for AI responses.
 * Replaces raw, unstyled Markdown with a polished, highly legible reading experience.
 */
export function AiMarkdownMessage({ content, role = 'assistant', className = '' }: AiMarkdownMessageProps) {
    if (!content) return null;

    if (role === 'user') {
        return (
            <div className={`text-xs sm:text-sm font-normal leading-relaxed text-foreground whitespace-pre-wrap ${className}`}>
                {content}
            </div>
        );
    }

    // Split text into structural blocks (paragraphs, headers, lists, quotes, dividers)
    const rawLines = content.split('\n');
    const blocks: React.ReactNode[] = [];

    let currentListItems: { type: 'ul' | 'ol'; text: string; num?: string }[] = [];

    const flushList = (keyPrefix: string) => {
        if (currentListItems.length === 0) return;

        const isOrdered = currentListItems[0].type === 'ol';
        blocks.push(
            <div key={`${keyPrefix}-list`} className="my-2.5 space-y-2">
                {currentListItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-foreground/90">
                        {isOrdered ? (
                            <span className="shrink-0 text-[10px] font-bold text-accent/90 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 mt-0.5 select-none">
                                {item.num || idx + 1}
                            </span>
                        ) : (
                            <span
                                className="h-1.5 w-1.5 rounded-full bg-accent/60 mt-2 shrink-0"
                                aria-hidden="true"
                            />
                        )}
                        <div className="flex-1 min-w-0">{renderInlineContent(item.text)}</div>
                    </div>
                ))}
            </div>
        );
        currentListItems = [];
    };

    rawLines.forEach((line, index) => {
        const trimmed = line.trim();

        // 1. Empty lines -> separate paragraphs
        if (!trimmed) {
            flushList(`line-${index}`);
            return;
        }

        // 2. Horizontal Divider (--- or ***)
        if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            flushList(`line-${index}`);
            blocks.push(<hr key={`hr-${index}`} className="border-border/30 my-3" />);
            return;
        }

        // 3. Headings (#, ##, ###, ####)
        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            flushList(`line-${index}`);
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];

            if (level === 1) {
                blocks.push(
                    <h3 key={`h1-${index}`} className="text-sm sm:text-base font-extrabold text-foreground tracking-tight mt-3.5 mb-1.5">
                        {renderInlineContent(headingText)}
                    </h3>
                );
            } else if (level === 2) {
                blocks.push(
                    <h4 key={`h2-${index}`} className="text-xs sm:text-sm font-bold text-foreground tracking-tight mt-3 mb-1.5">
                        {renderInlineContent(headingText)}
                    </h4>
                );
            } else {
                blocks.push(
                    <h5 key={`h3-${index}`} className="text-xs font-semibold text-foreground/90 tracking-normal mt-2.5 mb-1">
                        {renderInlineContent(headingText)}
                    </h5>
                );
            }
            return;
        }

        // 4. Blockquotes (> ...)
        if (trimmed.startsWith('>')) {
            flushList(`line-${index}`);
            const quoteText = trimmed.replace(/^>\s*/, '');
            blocks.push(
                <blockquote
                    key={`quote-${index}`}
                    className="border-l-2 border-accent/40 pl-3.5 my-2 text-foreground-muted/90 italic bg-white/[0.02] py-1.5 rounded-r-lg text-xs sm:text-sm leading-relaxed"
                >
                    {renderInlineContent(quoteText)}
                </blockquote>
            );
            return;
        }

        // 5. Ordered List Items (1. item, 2. item)
        const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
        if (olMatch) {
            if (currentListItems.length > 0 && currentListItems[0].type !== 'ol') {
                flushList(`line-${index}`);
            }
            currentListItems.push({
                type: 'ol',
                num: olMatch[1],
                text: olMatch[2],
            });
            return;
        }

        // 6. Unordered List Items (- item, * item)
        const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
        if (ulMatch) {
            if (currentListItems.length > 0 && currentListItems[0].type !== 'ul') {
                flushList(`line-${index}`);
            }
            currentListItems.push({
                type: 'ul',
                text: ulMatch[1],
            });
            return;
        }

        // 7. Regular Paragraph Text
        flushList(`line-${index}`);
        blocks.push(
            <p key={`p-${index}`} className="text-xs sm:text-sm leading-[1.65] text-foreground/90 my-1 font-normal text-pretty">
                {renderInlineContent(trimmed)}
            </p>
        );
    });

    // Flush any remaining list items
    flushList('final');

    return (
        <div className={`space-y-1 font-sans text-xs sm:text-sm leading-relaxed text-foreground/90 ${className}`}>
            {blocks}
        </div>
    );
}
