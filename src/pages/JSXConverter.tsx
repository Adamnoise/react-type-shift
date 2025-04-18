
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversionConfig, ConversionErrorDetails } from "@/lib/types";
import FileUploader from "@/components/FileUploader";
import BatchUploader from "@/components/BatchUploader";
import GitHubImporter from "@/components/GitHubImporter"; 
import CodePreview from "@/components/CodePreview";
import ConversionControls from "@/components/ConversionControls";
import ConversionConfig from "@/components/ConversionConfig";
import ErrorDetails from "@/components/ErrorDetails";
import ComparisonViewer from "@/components/ComparisonViewer";
import { JSXConverter } from "@/lib/jsxConverter";
import { toast } from "sonner";

const JSXConverterPage = () => {
  const [originalCode, setOriginalCode] = useState<string>("");
  const [convertedCode, setConvertedCode] = useState<string>("");
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [importedFiles, setImportedFiles] = useState<{ name: string; content: string }[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [errors, setErrors] = useState<ConversionErrorDetails[]>([]);
  const [config, setConfig] = useState<ConversionConfig>({
    conversionLevel: "standard",
  });
  
  // Handle file upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setOriginalCode(content || "");
      setConvertedCode("");
      setErrors([]);
    };
    reader.readAsText(file);
  };
  
  // Handle batch upload
  const handleBatchUpload = (files: File[]) => {
    setUploadedFiles(files);
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setOriginalCode(e.target?.result as string || "");
        setConvertedCode("");
      };
      reader.readAsText(files[0]);
      setSelectedFileIndex(0);
    }
  };
  
  // Handle GitHub import
  const handleGitHubImport = (files: { name: string; content: string }[]) => {
    setImportedFiles(files);
    if (files.length > 0) {
      setOriginalCode(files[0].content);
      setConvertedCode("");
      setSelectedFileIndex(0);
    }
  };
  
  // Convert JSX to TSX
  const handleConvert = async () => {
    if (!originalCode) {
      toast.error("Nincs konvertálandó kód.");
      return;
    }
    
    setIsConverting(true);
    setErrors([]);
    
    try {
      const { code, errors } = await JSXConverter.convertJSXtoTSX(originalCode, config);
      setConvertedCode(code);
      
      if (errors.length > 0) {
        setErrors(errors);
        toast.warning("Konvertálás befejezve figyelmeztetésekkel");
      } else {
        toast.success("JSX sikeresen konvertálva TSX-re");
      }
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Hiba történt a konvertálás során");
    } finally {
      setIsConverting(false);
    }
  };
  
  // Handle download
  const handleDownload = () => {
    if (!convertedCode) {
      toast.error("Nincs letölthető TSX kód");
      return;
    }
    
    const blob = new Blob([convertedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Determine filename
    let filename = "converted.tsx";
    if (uploadedFiles.length > 0 && selectedFileIndex < uploadedFiles.length) {
      filename = uploadedFiles[selectedFileIndex].name.replace(/\.jsx$/, ".tsx");
    } else if (importedFiles.length > 0 && selectedFileIndex < importedFiles.length) {
      filename = importedFiles[selectedFileIndex].name.replace(/\.jsx$/, ".tsx");
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`${filename} letöltve`);
  };
  
  // Batch convert
  const handleBatchConvert = async () => {
    if (importedFiles.length === 0 && uploadedFiles.length === 0) {
      toast.error("Nincsenek fájlok konvertáláshoz");
      return;
    }
    
    setIsConverting(true);
    
    try {
      let filesToConvert: { name: string; content: string }[] = [];
      
      // Use either imported files or uploaded files
      if (importedFiles.length > 0) {
        filesToConvert = importedFiles;
      } else if (uploadedFiles.length > 0) {
        // Convert uploaded files to the format needed
        const promises = uploadedFiles.map((file) => {
          return new Promise<{ name: string; content: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                name: file.name,
                content: e.target?.result as string || ""
              });
            };
            reader.onerror = reject;
            reader.readAsText(file);
          });
        });
        
        filesToConvert = await Promise.all(promises);
      }
      
      const result = await JSXConverter.batchConvert(filesToConvert, config);
      
      if (result.convertedFiles.length > 0) {
        toast.success(`${result.convertedFiles.length} fájl sikeresen konvertálva`);
        
        // Automatically export as zip if more than one file
        if (result.convertedFiles.length > 1) {
          await JSXConverter.exportAsZip(result.convertedFiles);
        } else {
          // Show the single converted file
          setConvertedCode(result.convertedFiles[0].content);
        }
      } else {
        toast.error("Nem sikerült egyetlen fájlt sem konvertálni");
      }
      
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} fájl konvertálása során hibák merültek fel`);
        // Display errors for the first file with issues
        if (result.errors[0].errors) {
          setErrors(result.errors[0].errors);
        }
      }
    } catch (error) {
      console.error("Batch conversion error:", error);
      toast.error("Hiba történt a kötegelt konvertálás során");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">JSX → TSX Konverter</h1>
            <p className="text-muted-foreground">
              JSX kód TypeScript TSX formátumra konvertálása, interfészek és típusok automatikus generálásával
            </p>
          </div>

          <Tabs defaultValue="file">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="file">Fájl feltöltése</TabsTrigger>
              <TabsTrigger value="batch">Kötegelt feltöltés</TabsTrigger>
              <TabsTrigger value="github">GitHub Import</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <FileUploader onFileUpload={handleFileUpload} />
                </div>
                <div>
                  <ConversionConfig onChange={setConfig} />
                </div>
              </div>
              <div className="flex justify-end">
                <ConversionControls
                  onConvert={handleConvert}
                  onDownload={handleDownload}
                  isConverting={isConverting}
                  canDownload={!!convertedCode}
                  canConvert={!!originalCode}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="batch" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <BatchUploader onFilesUpload={handleBatchUpload} />
                </div>
                <div>
                  <ConversionConfig onChange={setConfig} />
                </div>
              </div>
              <div className="flex justify-end">
                <ConversionControls
                  onConvert={handleBatchConvert}
                  onDownload={handleDownload}
                  isConverting={isConverting}
                  canDownload={!!convertedCode}
                  canConvert={uploadedFiles.length > 0}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="github" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <GitHubImporter onFilesLoad={handleGitHubImport} />
                </div>
                <div>
                  <ConversionConfig onChange={setConfig} />
                </div>
              </div>
              <div className="flex justify-end">
                <ConversionControls
                  onConvert={handleBatchConvert}
                  onDownload={handleDownload}
                  isConverting={isConverting}
                  canDownload={!!convertedCode}
                  canConvert={importedFiles.length > 0}
                />
              </div>
            </TabsContent>
          </Tabs>

          {errors.length > 0 && <ErrorDetails errors={errors} />}

          {(originalCode || convertedCode) && (
            <div className="mt-4">
              <ComparisonViewer originalCode={originalCode} convertedCode={convertedCode} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JSXConverterPage;
