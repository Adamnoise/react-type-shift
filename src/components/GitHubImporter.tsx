
import { useState } from "react";
import { fetchAllJsxFiles, fetchFileContent, parseGitHubUrl } from "@/lib/utils/githubFetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Github, FolderTree } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GitHubImporterProps {
  onFilesLoad: (files: { name: string; content: string }[]) => void;
}

const GitHubImporter = ({ onFilesLoad }: GitHubImporterProps) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [searchPath, setSearchPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundFiles, setFoundFiles] = useState<{ name: string; url: string; path: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; url: string; path: string }[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const handleSearch = async () => {
    if (!repoUrl) return;
    
    setIsLoading(true);
    setError(null);
    setFoundFiles([]);
    
    try {
      const { owner, repo, path } = parseGitHubUrl(repoUrl);
      const basePath = path || searchPath;
      
      const files = await fetchAllJsxFiles(owner, repo, basePath);
      
      if (files.length === 0) {
        setError(`Nem található JSX fájl a megadott útvonal alatt: ${basePath || "/"}`);
      } else {
        setFoundFiles(files);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Hiba történt a GitHub repository keresése közben");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFileSelection = (file: { name: string; url: string; path: string }) => {
    if (selectedFiles.some(f => f.url === file.url)) {
      setSelectedFiles(selectedFiles.filter(f => f.url !== file.url));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  const selectAllFiles = () => {
    if (selectedFiles.length === foundFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles([...foundFiles]);
    }
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsFetching(true);
    
    try {
      const importedFiles = [];
      
      for (const file of selectedFiles) {
        const content = await fetchFileContent(file.url);
        importedFiles.push({
          name: file.name,
          content
        });
      }
      
      onFilesLoad(importedFiles);
      toast.success(`${importedFiles.length} JSX fájl sikeresen importálva`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Hiba történt a fájlok letöltése közben");
      toast.error("Hiba történt az importálás során");
    } finally {
      setIsFetching(false);
    }
  };

  // Example repository URLs
  const exampleRepos = [
    "https://github.com/Winmix713/gf",
    "https://github.com/Winmix713/gf/tree/main/src/components",
    "https://github.com/Winmix713/gf/tree/main/src/pages"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Github className="mr-2 h-5 w-5" />
          GitHub Repository Importálása
        </CardTitle>
        <CardDescription>
          Konvertáljon JSX fájlokat közvetlenül GitHub repository-ból
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="repoUrl" className="text-sm font-medium block mb-1">
              Repository URL
            </label>
            <div className="flex gap-2">
              <Input
                id="repoUrl"
                placeholder="https://github.com/felhasznalo/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <Button
                onClick={handleSearch}
                disabled={isLoading || !repoUrl}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Keresés...
                  </>
                ) : (
                  "Keresés"
                )}
              </Button>
            </div>
            <div className="mt-1">
              <label htmlFor="searchPath" className="text-sm font-medium block mb-1">
                Útvonal a repository-n belül (opcionális)
              </label>
              <Input
                id="searchPath"
                placeholder="src/components"
                value={searchPath}
                onChange={(e) => setSearchPath(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Hiba</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && foundFiles.length > 0 && (
            <div className="border rounded-md">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium flex items-center">
                    <FolderTree className="mr-2 h-4 w-4" />
                    Talált JSX fájlok
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{foundFiles.length} fájl</Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAllFiles}
                    >
                      {selectedFiles.length === foundFiles.length ? "Kiválasztás törlése" : "Összes kiválasztása"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Kiválasztva</TableHead>
                      <TableHead>Fájlnév</TableHead>
                      <TableHead>Útvonal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {foundFiles.map((file) => (
                      <TableRow 
                        key={file.url}
                        className={selectedFiles.some(f => f.url === file.url) ? "bg-muted/40" : ""}
                        onClick={() => toggleFileSelection(file)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedFiles.some(f => f.url === file.url)}
                            onChange={() => toggleFileSelection(file)}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{file.name}</TableCell>
                        <TableCell className="text-gray-600 text-sm">{file.path}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Példa repository URL-ek:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              {exampleRepos.map((url, index) => (
                <li key={index} className="cursor-pointer hover:underline" onClick={() => setRepoUrl(url)}>
                  {url}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleImport}
          disabled={selectedFiles.length === 0 || isFetching}
          className="w-full"
        >
          {isFetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importálás...
            </>
          ) : (
            `Kiválasztott fájlok importálása (${selectedFiles.length})`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GitHubImporter;
