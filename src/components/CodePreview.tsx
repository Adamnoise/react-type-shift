
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SyntaxHighlighter } from "@/components/SyntaxHighlighter";

interface CodePreviewProps {
  originalCode: string;
  convertedCode: string;
}

const CodePreview = ({ originalCode, convertedCode }: CodePreviewProps) => {
  const [activeTab, setActiveTab] = useState<string>("split");

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="p-4 pb-0">
        <Tabs
          defaultValue="split"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="split">Split View</TabsTrigger>
            <TabsTrigger value="jsx">JSX</TabsTrigger>
            <TabsTrigger value="tsx">TSX</TabsTrigger>
          </TabsList>
        
          <CardContent className="p-0 overflow-hidden">
            <div className="min-h-[600px] max-h-[700px] md:max-h-[600px] overflow-hidden">
              <TabsContent value="split" className="m-0 h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 h-full divide-y md:divide-y-0 md:divide-x">
                  <div className="overflow-auto h-[300px] md:h-full">
                    <div className="p-3 bg-muted/40 font-medium text-sm border-b">
                      Original JSX
                    </div>
                    <SyntaxHighlighter code={originalCode} language="jsx" />
                  </div>
                  <div className="overflow-auto h-[300px] md:h-full">
                    <div className="p-3 bg-muted/40 font-medium text-sm border-b">
                      Converted TSX
                    </div>
                    <SyntaxHighlighter code={convertedCode} language="tsx" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="jsx" className="m-0 h-full">
                <div className="overflow-auto h-[600px]">
                  <div className="p-3 bg-muted/40 font-medium text-sm border-b">
                    Original JSX
                  </div>
                  <SyntaxHighlighter code={originalCode} language="jsx" />
                </div>
              </TabsContent>

              <TabsContent value="tsx" className="m-0 h-full">
                <div className="overflow-auto h-[600px]">
                  <div className="p-3 bg-muted/40 font-medium text-sm border-b">
                    Converted TSX
                  </div>
                  <SyntaxHighlighter code={convertedCode} language="tsx" />
                </div>
              </TabsContent>
            </div>
          </CardContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
};

export default CodePreview;
