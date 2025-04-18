
import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import CodePreview from "@/components/CodePreview";
import ConversionControls from "@/components/ConversionControls";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { JSXConverter } from "@/lib/jsxConverter";
import { ConversionConfig as ConfigType, ConversionErrorDetails } from "@/lib/types";
import ConversionConfig from "@/components/ConversionConfig";
import BatchUploader from "@/components/BatchUploader";
import ErrorDetails from "@/components/ErrorDetails";
import ComparisonViewer from "@/components/ComparisonViewer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileUp, FolderUp } from "lucide-react";

const Index = () => {
  const [originalCode, setOriginalCode] = useState<string>("");
  const [convertedCode, setConvertedCode] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isFileUploaded, setIsFileUploaded] = useState<boolean>(false);
  const [conversionMode, setConversionMode] = useState<"single" | "batch">("single");
  const [conversionConfig, setConversionConfig] = useState<ConfigType>({ conversionLevel: "standard" });
  const [errors, setErrors] = useState<ConversionErrorDetails[]>([]);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [convertedBatchFiles, setConvertedBatchFiles] = useState<{ name: string; content: string }[]>([]);
  const [batchErrors, setBatchErrors] = useState<{ fileName: string; errors: ConversionErrorDetails[] }[]>([]);

  const handleFileUpload = (file: File) => {
    // Validate file extension
    if (!file.name.endsWith(".jsx")) {
      toast.error("Csak .jsx kiterjesztésű fájlok támogatottak");
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
      setErrors([]);
    };
    reader.onerror = () => {
      toast.error("Hiba a fájl olvasása közben");
    };
    reader.readAsText(file);
  };

  const handleBatchUpload = (files: File[]) => {
    setBatchFiles(files);
    toast.success(`${files.length} fájl feltöltve konverzióra`);
  };

  const handleConvert = async () => {
    if (!originalCode) {
      toast.error("Először tölts fel egy JSX fájlt");
      return;
    }

    setIsConverting(true);
    try {
      // Handle conversion logic with configuration
      const result = await JSXConverter.convertJSXtoTSX(originalCode, conversionConfig);
      setConvertedCode(result.code);
      setErrors(result.errors);
      
      if (result.errors.length > 0) {
        toast.warning(`Konverzió befejezve ${result.errors.length} hibával`);
      } else {
        toast.success("Konverzió sikeresen befejezve");
      }
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Hiba a JSX TSX-re konvertálása közben");
    } finally {
      setIsConverting(false);
    }
  };

  const handleBatchConvert = async () => {
    if (batchFiles.length === 0) {
      toast.error("Először tölts fel JSX fájlokat");
      return;
    }

    setIsConverting(true);
    try {
      // Prepare the files for conversion
      const filesToConvert = await Promise.all(
        batchFiles.map(async (file) => {
          return new Promise<{ name: string; content: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                name: file.name,
                content: e.target?.result as string
              });
            };
            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
            reader.readAsText(file);
          });
        })
      );

      // Convert all files
      const { convertedFiles, errors } = await JSXConverter.batchConvert(filesToConvert, conversionConfig);
      
      setConvertedBatchFiles(convertedFiles);
      setBatchErrors(errors);
      
      if (errors.length > 0) {
        toast.warning(`Batch konverzió befejezve ${errors.length} hibával`);
      } else {
        toast.success(`${convertedFiles.length} fájl sikeresen konvertálva`);
      }
    } catch (error) {
      console.error("Batch conversion error:", error);
      toast.error("Hiba a batch konverzió során");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedCode) {
      toast.error("Nincs konvertált kód a letöltéshez");
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

    toast.success(`${tsxFileName} letöltve`);
  };

  const handleBatchDownload = async () => {
    if (convertedBatchFiles.length === 0) {
      toast.error("Nincs konvertált fájl a letöltéshez");
      return;
    }

    try {
      await JSXConverter.exportAsZip(convertedBatchFiles);
      toast.success("Konvertált fájlok letöltve ZIP archívumként");
    } catch (error) {
      console.error("Error exporting ZIP:", error);
      toast.error("Hiba a ZIP archívum létrehozása közben");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col w-full h-full gap-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            JSX to TSX Converter
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            JSX fájlok automatikus konvertálása TypeScript TSX formátumra megfelelő típusannotációkkal.
          </p>
        </header>

        <Tabs 
          defaultValue="single" 
          value={conversionMode} 
          onValueChange={(value) => setConversionMode(value as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="single" className="flex items-center">
              <FileUp className="w-4 h-4 mr-2" />
              Egyszeri konverzió
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center">
              <FolderUp className="w-4 h-4 mr-2" />
              Batch konverzió
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              {/* Left side - File upload panel */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <FileUploader onFileUpload={handleFileUpload} />

                {isFileUploaded && (
                  <div className="p-4 bg-card rounded-lg border">
                    <h3 className="font-medium mb-2">Fájl információ</h3>
                    <p className="text-sm mb-1">
                      <span className="text-muted-foreground">Név:</span> {fileName}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Méret:</span>{" "}
                      {(fileSize / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                <ConversionConfig 
                  onChange={setConversionConfig} 
                  defaultConfig={{ conversionLevel: "standard" }}
                />

                <ConversionControls
                  onConvert={handleConvert}
                  onDownload={handleDownload}
                  isConverting={isConverting}
                  canDownload={!!convertedCode}
                  canConvert={!!originalCode}
                />
                
                {errors.length > 0 && <ErrorDetails errors={errors} />}
              </div>

              {/* Right side - Code preview panel */}
              <div className="lg:col-span-2">
                {originalCode && convertedCode ? (
                  <ComparisonViewer
                    originalCode={originalCode}
                    convertedCode={convertedCode}
                  />
                ) : (
                  <CodePreview 
                    originalCode={originalCode} 
                    convertedCode={convertedCode} 
                  />
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="batch" className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              <div className="lg:col-span-1 flex flex-col gap-4">
                <BatchUploader onFilesUpload={handleBatchUpload} />
                
                <ConversionConfig 
                  onChange={setConversionConfig} 
                  defaultConfig={{ conversionLevel: "standard" }}
                />

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleBatchConvert}
                    disabled={isConverting || batchFiles.length === 0}
                    variant="default"
                    className="w-full"
                  >
                    {isConverting ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin">⟳</span>
                        Konvertálás...
                      </>
                    ) : (
                      <>
                        <FolderUp className="mr-2 h-4 w-4" />
                        Batch konverzió ({batchFiles.length} fájl)
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleBatchDownload}
                    disabled={convertedBatchFiles.length === 0}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    ZIP letöltése ({convertedBatchFiles.length} fájl)
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-2">
                {batchErrors.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {batchErrors.map((error, index) => (
                      <ErrorDetails 
                        key={index} 
                        errors={error.errors} 
                        fileName={error.fileName}
                      />
                    ))}
                  </div>
                ) : convertedBatchFiles.length > 0 ? (
                  <div className="bg-card border rounded-md p-4">
                    <h3 className="font-medium mb-4">Konvertált fájlok</h3>
                    <ul className="divide-y">
                      {convertedBatchFiles.map((file, index) => (
                        <li key={index} className="py-2">
                          <div className="flex justify-between items-center">
                            <span>{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {(file.content.length / 1024).toFixed(2)} KB
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">
                      Tölts fel JSX fájlokat a batch konverzióhoz
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
