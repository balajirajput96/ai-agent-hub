import { Streamdown } from "streamdown";

type MarkdownContentProps = {
  content: string;
};

/**
 * Isolates the markdown renderer so the large parsing dependency can load only
 * when a conversation message needs rich assistant formatting.
 */
export default function MarkdownContent({ content }: MarkdownContentProps) {
  return <Streamdown>{content}</Streamdown>;
}
