
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CitationTextProps {
  text: string;
  className?: string;
}

export function CitationText({ text, className = '' }: CitationTextProps) {
  const navigate = useNavigate();

  // Parse text for citation patterns like [Article: 507f1f77bcf86cd799439011] or [KB: articleId]
  const renderTextWithCitations = (inputText: string) => {
    // Pattern to match citations in various formats
    const citationPattern = /\[(Article|KB):\s*([a-f0-9]{24})\]/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationPattern.exec(inputText)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(inputText.slice(lastIndex, match.index));
      }

      // Add clickable citation
      const articleId = match[2];
      parts.push(
        <Button
          key={`citation-${match.index}-${articleId}`}
          variant="link"
          className="h-auto p-0 text-blue-600 hover:text-blue-800 underline inline text-sm"
          onClick={() => navigate(`/kb/${articleId}/view`)}
        >
          [Article {articleId.slice(-8)}]
        </Button>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < inputText.length) {
      parts.push(inputText.slice(lastIndex));
    }

    return parts.length > 1 ? parts : inputText;
  };

  return (
    <div className={className}>
      {renderTextWithCitations(text)}
    </div>
  );
}
