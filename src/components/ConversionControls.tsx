
import { Button } from "@/components/ui/button";
import { Download, Loader2, RefreshCw } from "lucide-react";

interface ConversionControlsProps {
  onConvert: () => void;
  onDownload: () => void;
  isConverting: boolean;
  canDownload: boolean;
  canConvert: boolean;
}

const ConversionControls = ({
  onConvert,
  onDownload,
  isConverting,
  canDownload,
  canConvert,
}: ConversionControlsProps) => {
  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={onConvert}
        disabled={isConverting || !canConvert}
        variant="default"
        className="w-full"
      >
        {isConverting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Converting...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Convert to TSX
          </>
        )}
      </Button>
      
      <Button
        onClick={onDownload}
        disabled={!canDownload}
        variant="outline"
        className="w-full"
      >
        <Download className="mr-2 h-4 w-4" />
        Download TSX File
      </Button>
    </div>
  );
};

export default ConversionControls;
