
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCode, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BatchUploaderProps {
  onFilesUpload: (files: File[]) => void;
}

const BatchUploader = ({ onFilesUpload }: BatchUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDrop = (acceptedFiles: File[]) => {
    // Filter for jsx files only
    const jsxFiles = acceptedFiles.filter((file) => 
      file.name.endsWith(".jsx")
    );
    
    if (jsxFiles.length > 0) {
      setFiles((prevFiles) => {
        // Remove duplicates by filename
        const fileMap = new Map<string, File>();
        [...prevFiles, ...jsxFiles].forEach(file => {
          fileMap.set(file.name, file);
        });
        return Array.from(fileMap.values());
      });
    }
  };

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "text/jsx": [".jsx"],
    },
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  });

  const removeFile = (fileName: string) => {
    setFiles(files.filter((file) => file.name !== fileName));
  };

  const handleProceed = () => {
    if (files.length > 0) {
      onFilesUpload(files);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
          isDragging
            ? "border-primary/80 bg-primary/10"
            : "border-muted bg-card/50 hover:bg-card hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          {isDragging ? (
            <FileCode className="h-10 w-10 text-primary mb-3" />
          ) : (
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
          )}
          <p className="text-lg font-medium mb-1">
            JSX fájlok vagy mappák feltöltése
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Húzd ide a JSX fájlokat vagy mappákat
          </p>
          <div className="flex gap-2">
            <Button type="button" onClick={open} variant="outline" size="sm">
              Fájlok kiválasztása
            </Button>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-card rounded-lg border p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Feltöltött fájlok</h3>
            <Badge variant="outline">{files.length} fájl</Badge>
          </div>
          
          <div className="max-h-60 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fájlnév</TableHead>
                  <TableHead className="text-right">Méret</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.name}>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell className="text-right">
                      {(file.size / 1024).toFixed(2)} KB
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.name)}
                      >
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleProceed}
              disabled={files.length === 0}
            >
              <Upload className="mr-2 h-4 w-4" />
              Fájlok konvertálása
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchUploader;
