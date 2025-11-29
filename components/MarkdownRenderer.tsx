import React from 'react';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    const renderContent = (text: string) => {
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeLines: string[] = [];
        let codeLanguage = '';

        lines.forEach((line, lineIndex) => {
            // Check for code block markers
            if (line.trim().startsWith('```')) {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeLanguage = line.trim().substring(3);
                    codeLines = [];
                } else {
                    // End of code block
                    inCodeBlock = false;
                    const codeText = codeLines.join('\n');

                    // Create a self-contained CopyButton for the renderer
                    const CodeBlockWithCopy = () => {
                        const [copied, setCopied] = React.useState(false);

                        const handleCopy = async () => {
                            try {
                                await navigator.clipboard.writeText(codeText);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            } catch (err) {
                                console.error('Failed to copy:', err);
                            }
                        };

                        return (
                            <div key={`code-${lineIndex}`} className="my-3 rounded-lg overflow-hidden border border-brand-cyan/20 bg-brand-dark/50">
                                <div className="px-3 py-1.5 text-xs font-mono text-gray-400 bg-brand-gray/80 border-b border-brand-light-gray/30 flex justify-between items-center">
                                    <span>{codeLanguage || 'code'}</span>
                                    <button
                                        onClick={handleCopy}
                                        className="text-brand-cyan hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        {copied ? (
                                            <>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                <span>Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <pre className="p-4 overflow-x-auto">
                                    <code className="text-sm text-gray-300 font-mono leading-relaxed">
                                        {codeText}
                                    </code>
                                </pre>
                            </div>
                        );
                    };

                    elements.push(<CodeBlockWithCopy key={`code-block-${lineIndex}`} />);
                    codeLines = [];
                    codeLanguage = '';
                }
                return;
            }

            if (inCodeBlock) {
                codeLines.push(line);
                return;
            }

            // Process inline elements
            const processInline = (text: string): React.ReactNode[] => {
                const parts: React.ReactNode[] = [];
                let remaining = text;
                let key = 0;

                while (remaining.length > 0) {
                    // Inline code with backticks
                    const inlineCodeMatch = remaining.match(/`([^`]+)`/);
                    if (inlineCodeMatch && inlineCodeMatch.index !== undefined) {
                        // Add text before the code
                        if (inlineCodeMatch.index > 0) {
                            const before = remaining.substring(0, inlineCodeMatch.index);
                            parts.push(processBoldAndOther(before, key++));
                        }
                        // Add inline code
                        parts.push(
                            <code
                                key={`code-${key++}`}
                                className="px-2 py-0.5 bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 rounded text-sm font-mono"
                            >
                                {inlineCodeMatch[1]}
                            </code>
                        );
                        remaining = remaining.substring(inlineCodeMatch.index + inlineCodeMatch[0].length);
                        continue;
                    }

                    // No more inline code, process rest
                    parts.push(processBoldAndOther(remaining, key++));
                    break;
                }

                return parts;
            };

            const processBoldAndOther = (text: string, baseKey: number): React.ReactNode => {
                // Bold text
                const parts: React.ReactNode[] = [];
                let remaining = text;
                let key = baseKey;

                while (remaining.length > 0) {
                    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
                    if (boldMatch && boldMatch.index !== undefined) {
                        if (boldMatch.index > 0) {
                            parts.push(<span key={`text-${key++}`}>{remaining.substring(0, boldMatch.index)}</span>);
                        }
                        parts.push(
                            <strong key={`bold-${key++}`} className="font-bold text-gray-100">
                                {boldMatch[1]}
                            </strong>
                        );
                        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
                        continue;
                    }
                    parts.push(<span key={`text-${key++}`}>{remaining}</span>);
                    break;
                }

                return <>{parts}</>;
            };

            // Headers
            if (line.startsWith('### ')) {
                elements.push(
                    <h3 key={lineIndex} className="text-lg font-bold text-gray-200 mt-4 mb-2">
                        {processInline(line.substring(4))}
                    </h3>
                );
            } else if (line.startsWith('## ')) {
                elements.push(
                    <h2 key={lineIndex} className="text-xl font-bold text-gray-100 mt-5 mb-3">
                        {processInline(line.substring(3))}
                    </h2>
                );
            } else if (line.startsWith('# ')) {
                elements.push(
                    <h1 key={lineIndex} className="text-2xl font-bold text-gray-100 mt-6 mb-4">
                        {processInline(line.substring(2))}
                    </h1>
                );
            }
            // Lists
            else if (line.trim().match(/^[•\-\*]\s/)) {
                const cleanText = line.trim().replace(/^[•\-\*]\s/, '');
                elements.push(
                    <li key={lineIndex} className="ml-4 text-gray-300 leading-relaxed">
                        {processInline(cleanText)}
                    </li>
                );
            }
            // Regular paragraphs
            else if (line.trim()) {
                elements.push(
                    <p key={lineIndex} className="text-gray-300 leading-relaxed mb-2">
                        {processInline(line)}
                    </p>
                );
            }
            // Empty lines
            else {
                elements.push(<div key={lineIndex} className="h-2" />);
            }
        });

        return elements;
    };

    return <div className="markdown-content">{renderContent(content)}</div>;
};

export default MarkdownRenderer;
