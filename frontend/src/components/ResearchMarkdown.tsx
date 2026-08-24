import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ResearchMarkdown({ content }: { content: string }) {
  return <div className="research-markdown">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        table: ({ node: _node, ...props }) => <div className="report-table-scroll"><table {...props} /></div>,
        a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>;
}
