
import { ConversionErrorDetails } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface ErrorProps {
  errors: ConversionErrorDetails[];
  fileName?: string;
}

const ErrorDetails = ({ errors, fileName }: ErrorProps) => {
  if (!errors || errors.length === 0) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "info":
        return <Info className="h-4 w-4 text-info" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "destructive";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <div className="bg-card border rounded-md p-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          {fileName ? `Hibák - ${fileName}` : "Konverziós hibák"}
        </h3>
        <Badge variant="outline">{errors.length} hiba</Badge>
      </div>

      <Accordion type="multiple" className="w-full">
        {errors.map((error, index) => (
          <AccordionItem key={index} value={`error-${index}`}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                {getSeverityIcon(error.severity)}
                <span className="text-sm">
                  {error.line > 0
                    ? `Sor ${error.line}${
                        error.column > 0 ? `, oszlop ${error.column}` : ""
                      }`
                    : ""}
                </span>
                <Badge variant={getSeverityColor(error.severity) as any}>
                  {error.code}
                </Badge>
                <span className="text-sm">{error.message}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {error.codeSnippet && (
                <div className="bg-muted p-3 my-2 rounded-md overflow-x-auto">
                  <pre className="text-xs">{error.codeSnippet}</pre>
                </div>
              )}

              {error.suggestions && error.suggestions.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">Javaslatok:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {error.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default ErrorDetails;
