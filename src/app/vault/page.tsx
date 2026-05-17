'use client';

import { Shield, Coins, Lock, Upload, FileText, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function VaultPage() {
  // TODO: Wire to real Supabase storage when token DB is ready
  const userTokens = 10;
  const docCost = 3;
  const hasTokens = userTokens >= docCost;

  return (
    <div className="py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Secure Document Vault</h1>
          </div>
          <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-sm font-medium border border-yellow-200">
            <Coins className="w-4 h-4" />
            <span>{userTokens} tokens available — {docCost} per document</span>
          </div>
        </div>

        {/* Token Info */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <Lock className="w-5 h-5" />
              <span className="text-sm">Each document costs <strong>{docCost} tokens</strong> to access. Watch ads or buy more tokens.</span>
            </div>
            <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
              <Coins className="w-4 h-4 mr-1" /> Earn Tokens
            </Button>
          </CardContent>
        </Card>

        {/* Upload */}
        <Card className="mb-8">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload a Document</h3>
              <p className="text-sm text-muted-foreground mb-4">Drag and drop or click to browse. Encrypted end-to-end.</p>
              <Button disabled={!hasTokens} className={!hasTokens ? 'opacity-50 cursor-not-allowed' : ''}>
                <Upload className="w-4 h-4 mr-2" />
                {hasTokens ? 'Upload Document (3 tokens)' : 'Not enough tokens'}
              </Button>
              {!hasTokens && (
                <p className="text-xs text-muted-foreground mt-2">Watch an ad or buy tokens to upload documents.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Your Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No documents yet. Upload your first document above.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
