
import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import CodePreview from "@/components/CodePreview";
import ConversionControls from "@/components/ConversionControls";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { JSXConverter } from "@/lib/jsxConverter";

const Index = () => {
  const [originalCode, setOriginalCode] = useState<string>("");
  const [convertedCode, setConvertedCode] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isFileUploaded, setIsFileUploaded] = useState<boolean>(false);

  const handleFileUpload = (file: File) => {
    // Validate file extension
    if (!file.name.endsWith(".jsx")) {
      toast.error("Please upload a .jsx file");
      return;
    }

    // Store file metadata
    setFileName(file.name);
    setFileSize(file.size);
    setIsFileUploaded(true);

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setOriginalCode(content);
      // Reset converted code when new file is uploaded
      setConvertedCode("");
    };
    reader.onerror = () => {
      toast.error("Error reading file");
    };
    reader.readAsText(file);
  };

  const handleConvert = async () => {
    if (!originalCode) {
      toast.error("Please upload a JSX file first");
      return;
    }

    setIsConverting(true);
    try {
      // Handle conversion logic
      const tsxCode = await JSXConverter.convertJSXtoTSX(originalCode);
      setConvertedCode(tsxCode);
      toast.success("Conversion completed successfully");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Error converting JSX to TSX");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedCode) {
      toast.error("No converted code to download");
      return;
    }

    // Create tsxFileName by replacing .jsx with .tsx
    const tsxFileName = fileName.replace(".jsx", ".tsx");

    // Create downloadable blob
    const blob = new Blob([convertedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tsxFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${tsxFileName}`);
  };

  return (
    <Layout>
      <div className="flex flex-col w-full h-full gap-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            JSX to TSX Converter
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a JSX file to automatically convert it to TypeScript TSX format with proper type annotations for component props.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Left side - File upload panel */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <FileUploader onFileUpload={handleFileUpload} />

            {isFileUploaded && (
              <div className="p-4 bg-card rounded-lg border">
                <h3 className="font-medium mb-2">File Information</h3>
                <p className="text-sm mb-1">
                  <span className="text-muted-foreground">Name:</span> {fileName}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Size:</span>{" "}
                  {(fileSize / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <ConversionControls
              onConvert={handleConvert}
              onDownload={handleDownload}
              isConverting={isConverting}
              canDownload={!!convertedCode}
              canConvert={!!originalCode}
            />
          </div>

          {/* Right side - Code preview panel */}
          <div className="lg:col-span-2">
            <CodePreview 
              originalCode={originalCode} 
              convertedCode={convertedCode} 
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
