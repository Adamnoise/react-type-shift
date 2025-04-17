
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

const FileUploader = ({ onFileUpload }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0]);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: {
      "text/jsx": [".jsx"],
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
        isDragging
          ? "border-primary/80 bg-primary/10"
          : "border-muted bg-card/50 hover:bg-card hover:border-primary/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center text-center mb-4">
        {isDragging ? (
          <FileCode className="h-12 w-12 text-primary mb-4" />
        ) : (
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
        )}
        <p className="text-lg font-medium mb-1">
          Drag & drop your JSX file here
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Only .jsx files are accepted
        </p>
      </div>
      <Button type="button" onClick={open} variant="outline" size="sm">
        Browse File
      </Button>
    </div>
  );
};

export default FileUploader;
