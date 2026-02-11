'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Upload, Video, Image, FileText, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function UploadPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isShort, setIsShort] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please sign in to upload videos.</p>
            <Button className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // Auto-detect if it's a short based on duration (would need actual video processing)
      setIsShort(file.size < 50 * 1024 * 1024); // Rough heuristic
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;

    setUploading(true);
    // Here you would implement the actual upload logic
    // For now, just simulate upload
    setTimeout(() => {
      setUploading(false);
      alert('Video uploaded successfully!');
      // Reset form
      setTitle('');
      setDescription('');
      setTags('');
      setVideoFile(null);
      setThumbnailFile(null);
      setIsShort(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Upload Video</h1>
          <p className="text-muted-foreground mt-2">Share your content with the VideoHub community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Video Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Video Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Video File
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30">
                      {videoFile ? (
                        <div className="flex items-center justify-center space-x-4">
                          <Video className="w-8 h-8 text-primary" />
                          <div>
                            <p className="font-medium">{videoFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setVideoFile(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-2">Drag and drop your video here, or click to browse</p>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                            id="video-upload"
                          />
                          <label htmlFor="video-upload">
                            <Button type="button" variant="outline" asChild>
                              <span>Choose Video</span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Thumbnail (Optional)
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center bg-muted/30">
                      {thumbnailFile ? (
                        <div className="flex items-center justify-center space-x-4">
                          <Image className="w-6 h-6 text-accent" />
                          <div>
                            <p className="font-medium">{thumbnailFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(thumbnailFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setThumbnailFile(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            className="hidden"
                            id="thumbnail-upload"
                          />
                          <label htmlFor="thumbnail-upload">
                            <Button type="button" variant="ghost" size="sm" asChild>
                              <span>Choose Thumbnail</span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                      Title
                    </label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter video title"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-border bg-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                      placeholder="Describe your video"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
                      Tags (comma separated)
                    </label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="gaming, tutorial, fun"
                    />
                  </div>

                  {/* Video Type */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is-short"
                      checked={isShort}
                      onChange={(e) => setIsShort(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="is-short" className="text-sm text-muted-foreground">
                      This is a short video (under 60 seconds)
                    </label>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={!videoFile || uploading}
                    className="w-full"
                  >
                    {uploading ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Upload Guidelines */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Video className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Video Formats</h4>
                    <p className="text-sm text-gray-600">MP4, MOV, AVI up to 2GB</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Image className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <h4 className="font-medium">Thumbnails</h4>
                    <p className="text-sm text-muted-foreground">JPG, PNG up to 2MB, 1280x720 recommended</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Content Policy</h4>
                    <p className="text-sm text-muted-foreground">No spam, hate speech, or copyrighted material without permission</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monetization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Earn from your content through ads, subscriptions, and super likes.
                </p>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}