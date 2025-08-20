import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';

const DOCUMENT_TYPES = [
  'Passport',
  'Birth Certificate',
  'Educational Certificates',
  'Work Experience Letters',
  'English Test Results',
  'Skills Assessment',
  'Police Clearance',
  'Medical Reports',
  'Financial Documents',
  'CV/Resume',
  'Other'
];

interface UploadedDocument {
  id: string;
  file_name: string;
  document_type: string;
  file_size: number;
  uploaded_at: string;
  file_path: string;
}

export const DocumentUpload: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedType, setSelectedType] = useState('');

  const fetchDocuments = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
      return;
    }

    setDocuments(data || []);
  }, [user, toast]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !selectedType) {
      console.log('Upload validation failed:', { file: !!file, user: !!user, selectedType });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('Attempting upload:', { fileName, userId: user.id, fileSize: file.size });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
      
      console.log('Upload result:', { uploadError });

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);
      }, 1000);

      if (uploadError) throw uploadError;

      // Save document record to database
      const { error: dbError } = await supabase
        .from('user_documents')
        .insert({
          user_id: user.id,
          document_type: selectedType,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      setSelectedType('');
      fetchDocuments();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      fetchDocuments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload New Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Document Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full mt-1 p-3 border border-input rounded-md bg-background"
            >
              <option value="">Select document type...</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading || !selectedType}
              className="w-full p-3 border border-input rounded-md bg-background file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
            </p>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5" />
            Uploaded Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{doc.document_type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};