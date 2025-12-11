import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getAuthToken } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  File,
  Download,
  Folder,
  Trash2,
  Upload,
  Loader2,
  FileText
} from "lucide-react";

interface Document {
  id: number;
  title: string;
  filename: string;
  fileType: string;
  size: number;
  url: string;
  createdAt: string;
}

export default function Documentation() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await api.get("/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
      toast.error("Erro ao carregar lista de documentos.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    const token = getAuthToken();
    if (!token) {
      toast.error("Você precisa estar logado para enviar documentos.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      await api.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
        },
      });
      toast.success("Documento enviado com sucesso!");
      setUploadFile(null);
      // Reset input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      fetchDocuments();
    } catch (error: any) {
      console.error("Erro ao enviar documento:", error);
      const message = error.response?.data?.error || "Erro ao enviar documento.";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Você precisa estar logado para baixar documentos.");
      return;
    }

    try {
      const response = await api.get(`/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar documento:", error);
      toast.error("Erro ao iniciar download.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    const token = getAuthToken();
    if (!token) {
      toast.error("Você precisa estar logado para excluir documentos.");
      return;
    }

    try {
      await api.delete(`/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Documento excluído com sucesso!");
      fetchDocuments();
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      toast.error("Erro ao excluir documento.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <File className="h-8 w-8 text-red-500 flex-shrink-0" />;
    if (ext === 'doc' || ext === 'docx') return <FileText className="h-8 w-8 text-blue-700 flex-shrink-0" />;
    if (ext === 'xls' || ext === 'xlsx') return <FileText className="h-8 w-8 text-green-600 flex-shrink-0" />;
    return <File className="h-8 w-8 text-gray-500 flex-shrink-0" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Meus Arquivos</h1>
        <p className="text-muted-foreground">
          Armazene e gerencie seus documentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            <CardTitle>Repositório de Documentos</CardTitle>
          </div>
          <CardDescription>
            Envie, baixe e gerencie seus arquivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <h4 className="font-medium mb-2">Adicionar novo documento</h4>
                <div className="flex gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="bg-background"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
                className="w-full md:w-auto mt-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Arquivo
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Documentos Disponíveis ({documents.length})</h3>

            {documents.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Folder className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>Nenhum documento encontrado.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group relative">
                    {getFileIcon(doc.filename)}

                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleDownload(doc)}>
                      <h4 className="font-medium truncate" title={doc.title}>{doc.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{doc.filename.split('.').pop()?.toUpperCase()}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.size)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
