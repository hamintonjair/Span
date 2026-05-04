'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  theme?: 'blue' | 'purple';
}

export default function MarkdownRenderer({ 
  content, 
  className = '', 
  theme = 'blue' 
}: MarkdownRendererProps) {
  const themeClasses = {
    blue: {
      container: 'prose prose-lg max-w-none',
      h1: 'prose-h1:text-3xl prose-h1:font-bold prose-h1:text-black prose-h1:mt-8 prose-h1:mb-4 prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2',
      h2: 'prose-h2:text-2xl prose-h2:font-semibold prose-h2:text-black prose-h2:mt-6 prose-h2:mb-3',
      h3: 'prose-h3:text-xl prose-h3:font-semibold prose-h3:text-black prose-h3:mt-4 prose-h3:mb-2',
      p: 'prose-p:text-gray-700 prose-p:leading-relaxed',
      strong: 'prose-strong:text-black',
      em: 'prose-em:text-gray-800',
      a: 'prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline',
      ul: 'prose-ul:space-y-2 prose-ul:my-4',
      ol: 'prose-ol:space-y-2 prose-ol:my-4',
      li: 'prose-li:text-gray-700 prose-li:mb-2',
      blockquote: 'prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:bg-gray-50 prose-blockquote:p-4 prose-blockquote:italic prose-blockquote:my-4',
      code: 'prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm',
      pre: 'prose-pre:bg-gray-900 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto',
      table: 'prose-table:border prose-table:border-gray-200 prose-table:w-full',
      th: 'prose-th:bg-gray-50 prose-th:font-semibold prose-th:px-4 prose-th:py-2 prose-th:text-left',
      td: 'prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-gray-200'
    },
    purple: {
      container: 'prose prose-lg max-w-none',
      h1: 'prose-h1:text-3xl prose-h1:font-bold prose-h1:text-black prose-h1:mt-8 prose-h1:mb-4 prose-h1:border-b prose-h1:border-purple-200 prose-h1:pb-2',
      h2: 'prose-h2:text-2xl prose-h2:font-semibold prose-h2:text-black prose-h2:mt-6 prose-h2:mb-3',
      h3: 'prose-h3:text-xl prose-h3:font-semibold prose-h3:text-black prose-h3:mt-4 prose-h3:mb-2',
      p: 'prose-p:text-gray-700 prose-p:leading-relaxed',
      strong: 'prose-strong:text-black',
      em: 'prose-em:text-gray-800',
      a: 'prose-a:text-purple-600 prose-a:font-medium prose-a:no-underline hover:prose-a:text-purple-800 hover:prose-a:underline',
      ul: 'prose-ul:space-y-2 prose-ul:my-4',
      ol: 'prose-ol:space-y-2 prose-ol:my-4',
      li: 'prose-li:text-gray-700 prose-li:mb-2',
      blockquote: 'prose-blockquote:border-l-4 prose-blockquote:border-purple-300 prose-blockquote:bg-purple-50 prose-blockquote:p-4 prose-blockquote:italic prose-blockquote:my-4',
      code: 'prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm',
      pre: 'prose-pre:bg-gray-900 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto',
      table: 'prose-table:border prose-table:border-gray-200 prose-table:w-full',
      th: 'prose-th:bg-gray-50 prose-th:font-semibold prose-th:px-4 prose-th:py-2 prose-th:text-left',
      td: 'prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-gray-200'
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`${currentTheme.container} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 className={currentTheme.h1} {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className={currentTheme.h2} {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className={currentTheme.h3} {...props}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className={currentTheme.p} {...props}>
              {children}
            </p>
          ),
          strong: ({ children, ...props }) => (
            <strong className={currentTheme.strong} {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className={currentTheme.em} {...props}>
              {children}
            </em>
          ),
          a: ({ children, href, ...props }) => (
            <a 
              href={href} 
              className={currentTheme.a} 
              target="_blank" 
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          ul: ({ children, ...props }) => (
            <ul className={currentTheme.ul} {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className={currentTheme.ol} {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className={currentTheme.li} {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className={currentTheme.blockquote} {...props}>
              {children}
            </blockquote>
          ),
          code: ({ children, ...props }) => (
            <code className={currentTheme.code} {...props}>
              {children}
            </code>
          ),
          pre: ({ children, ...props }) => (
            <pre className={currentTheme.pre} {...props}>
              {children}
            </pre>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className={currentTheme.table} {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className={currentTheme.th} {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className={currentTheme.td} {...props}>
              {children}
            </td>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
