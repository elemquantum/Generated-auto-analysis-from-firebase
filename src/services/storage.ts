import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Uploads a base64 data URI to Firebase Storage.
 * @param dataUri The base64 data URI.
 * @param path The path in Firebase Storage where the file should be saved.
 * @returns The public download URL of the uploaded file.
 */
export async function uploadImageToFirebase(dataUri: string, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    
    // 'data_url' is the format for handling base64 strings, which is what we get from the browser/Genkit.
    const snapshot = await uploadString(storageRef, dataUri, 'data_url');
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}
