import ReactMarkdown from "react-markdown";

// Tailwind-styled element overrides so we don't depend on the typography plugin.
const components = {
  p: (props) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
  ul: (props) => <ul className="mb-2 list-disc pl-5" {...props} />,
  ol: (props) => <ol className="mb-2 list-decimal pl-5" {...props} />,
  li: (props) => <li className="mb-1" {...props} />,
  a: (props) => (
    <a className="text-blue-600 underline" target="_blank" rel="noreferrer" {...props} />
  ),
  h1: (props) => <h1 className="mb-2 text-lg font-bold" {...props} />,
  h2: (props) => <h2 className="mb-2 text-base font-bold" {...props} />,
  h3: (props) => <h3 className="mb-2 text-sm font-bold" {...props} />,
  blockquote: (props) => (
    <blockquote className="mb-2 border-l-4 border-gray-300 pl-3 italic text-gray-600" {...props} />
  ),
  // react-markdown v9 dropped the `inline` prop, so style code uniformly and
  // let `pre` provide the block wrapper. Works for both inline and fenced code.
  pre: (props) => <pre className="mb-2 overflow-x-auto" {...props} />,
  code: (props) => (
    <code className="rounded bg-gray-100 px-1 py-0.5 text-sm" {...props} />
  ),
};

export default function MarkdownRenderer({ content }) {
  return <ReactMarkdown components={components}>{content || ""}</ReactMarkdown>;
}
