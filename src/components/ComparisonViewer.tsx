
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Copy } from "lucide-react";
import { toast } from "sonner";
import SyntaxHighlighter from "@/components/SyntaxHighlighter";

interface ComparisonViewerProps {
  originalCode: string;
  convertedCode: string;
}

const ComparisonViewer = ({
  originalCode,
  convertedCode,
}: ComparisonViewerProps) => {
  const [viewMode, setViewMode] = useState<"side-by-side" | "split" | "diff">(
    "side-by-side"
  );

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${type} kód vágólapra másolva`);
  };

  // Generate a simple diff view (this is a basic implementation)
  const diffView = useMemo(() => {
    if (!originalCode || !convertedCode) return "";
    
    const originalLines = originalCode.split("\n");
    const convertedLines = convertedCode.split("\n");
    
    const maxLines = Math.max(originalLines.length, convertedLines.length);
    let diffOutput = "";
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || "";
      const convertedLine = convertedLines[i] || "";
      
      if (originalLine !== convertedLine) {
        diffOutput += `- ${originalLine}\n+ ${convertedLine}\n`;
      } else {
        diffOutput += `  ${originalLine}\n`;
      }
    }
    
    return diffOutput;
  }, [originalCode, convertedCode]);

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">Kód összehasonlítás</h3>
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as any)}
          className="w-auto"
        >
          <TabsList className="w-auto">
            <TabsTrigger value="side-by-side" className="text-xs">
              Kód megtekintése
            </TabsTrigger>
            <TabsTrigger value="diff" className="text-xs">
              Változtatások
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "side-by-side" && (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">JSX</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(originalCode, "JSX")}
              >
                <Copy className="h-3 w-3 mr-1" />
                <span className="text-xs">Másolás</span>
              </Button>
            </div>
            <SyntaxHighlighter code={originalCode} language="jsx" />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">TSX</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(convertedCode, "TSX")}
              >
                <Copy className="h-3 w-3 mr-1" />
                <span className="text-xs">Másolás</span>
              </Button>
            </div>
            <SyntaxHighlighter code={convertedCode} language="tsx" />
          </div>
        </div>
      )}

      {viewMode === "diff" && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Változtatások</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(diffView, "Diff")}
            >
              <ArrowLeftRight className="h-3 w-3 mr-1" />
              <span className="text-xs">Változások másolása</span>
            </Button>
          </div>
          <div className="rounded-md bg-muted overflow-auto max-h-96 text-sm">
            <SyntaxHighlighter code={diffView} language="diff" />
          </div>
          <div className="flex gap-2 mt-2 text-sm">
            <span className="flex items-center">
              <span className="w-3 h-3 inline-block bg-red-500/20 border border-red-500 mr-1"></span>
              <span className="text-xs">Eltávolított sorok</span>
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 inline-block bg-green-500/20 border border-green-500 mr-1"></span>
              <span className="text-xs">Hozzáadott sorok</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonViewer;
