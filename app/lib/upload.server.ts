import { v2 as cloudinary } from "cloudinary";
import { array } from "zod";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const bucket = process.env.CLOUDINARY_BUCKET;

export async function uploadFile(file: File | undefined) {

    if (!file) {
        return {
            error: 'No file selected',
            url: ''
        };
    }

    try {
        // Convert the file to a buffer
        const fileBuffer = await file.arrayBuffer();
        const base64String = Buffer.from(fileBuffer).toString('base64');

        const mimeType = file.type || 'application/octet-stream'; // Default to binary if type unknown
        const dataUrl = `data:${mimeType};base64,${base64String}`;

        const { secure_url } = await cloudinary.uploader.upload(dataUrl, {
            folder: bucket,
            public_id: file.name,

        });


        return {
            url: secure_url,
            error: ''
        };
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error uploading file to S3:', error.message);
            return {
                error: 'Error uploading file to S3: ' + error.message,
                url: ''
            };
        } else {
            return {
                error: 'An unknown error occurred during file upload.',
                url: ''
            };
        }
    }

}

export async function deleteFile(filename?: string): Promise<boolean> {

    if (!filename) {
        return false
    }
    try {
        await cloudinary.uploader.destroy(
            process.env.CLOUDINARY_BUCKET + "/" + filename
        );

        return true;
    } catch (error) {
        // Handle any errors during the deletion process
        if (error instanceof Error) {
            console.error("Error deleting file from S3:", error.message);
        }
        console.error("An unknown error occurred during file deletion.");
        return false;
    }
}
