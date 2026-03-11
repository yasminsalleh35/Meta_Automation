import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodePreviewProps {
  code: any;
  title?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, title = 'Preview' }) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(code, null, 2));
    setCopied(true);
    toast({
      title: 'Copiado!',
      description: 'JSON copiado para a área de transferência',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Button size="sm" variant="ghost" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
          <code>{JSON.stringify(code, null, 2)}</code>
        </pre>
      </CardContent>
    </Card>
  );
};

export default CodePreview;
