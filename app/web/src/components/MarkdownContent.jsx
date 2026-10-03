import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

const contentClassName = [
  "cms-markdown max-w-none text-foreground",
  "[&_h1]:mb-4 [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-foreground",
  "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground",
  "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground",
  "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-muted-foreground",
  "[&_li]:mb-1",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_hr]:my-8 [&_hr]:border-border",
].join(" ");

export function MarkdownContent({ children, className }) {
  const markdown = typeof children === "string" ? children : String(children ?? "");
  return (
    <div className={cn(contentClassName, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
