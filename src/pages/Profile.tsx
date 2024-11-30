import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Camera, Loader2 } from 'lucide-react';
import { getGradientForUser } from '@/lib/utils';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const schema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
});

type FormData = z.infer<typeof schema>;

export default function Profile() {
  const { currentUser, updateUserProfile } = useAuth()!;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize preview URL from currentUser
  useEffect(() => {
    if (currentUser?.photoURL) {
      setPreviewUrl(currentUser.photoURL);
    }
  }, [currentUser]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a valid image file (JPEG, PNG, or WebP)',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
      });
      return;
    }

    try {
      setUploadingImage(true);

      // Create local preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Delete old profile picture if it exists
      if (currentUser?.photoURL?.startsWith('https://firebasestorage.googleapis.com')) {
        try {
          const oldImageRef = ref(storage, currentUser.photoURL);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.error('Error deleting old profile picture:', error);
        }
      }

      // Upload new image
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `profile-pictures/${currentUser.uid}/${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update user profile and Firestore in parallel
      await Promise.all([
        updateUserProfile({ photoURL: downloadURL }),
        updateDoc(doc(db, 'users', currentUser.uid), {
          photoURL: downloadURL,
          updatedAt: new Date().toISOString()
        })
      ]);

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile picture. Please try again.',
      });
      // Reset preview on error
      setPreviewUrl(currentUser?.photoURL || null);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: currentUser?.displayName || ''
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await updateUserProfile({ displayName: data.displayName });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="relative group">
            <Avatar className="h-24 w-24 cursor-pointer" onClick={handleImageClick}>
              {previewUrl && <AvatarImage src={previewUrl} alt="Profile" />}
              <AvatarFallback 
                className={`text-2xl text-white bg-gradient-to-br ${getGradientForUser(currentUser?.email || '')}`}
              >
                {currentUser?.displayName?.[0]?.toUpperCase() || 
                 currentUser?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingImage ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploadingImage}
            />
          </div>
          <h2 className="text-2xl font-bold">Profile Settings</h2>
          <p className="text-gray-500">{currentUser?.email}</p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                {...register('displayName')}
                className={errors.displayName ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.displayName && (
                <p className="text-sm text-red-500">{errors.displayName.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/chat')}
              className="w-full"
              disabled={loading || uploadingImage}
            >
              Back to Chat
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}