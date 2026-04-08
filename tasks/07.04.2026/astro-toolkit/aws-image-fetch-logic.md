# AWS Image Fetch Logic Documentation

- Status: Documentation (no code action)
- Notes: Reference doc — describes the legacy V2 picture-fetch API for context. Already informational; current Next.js implementation uses Supabase storage.

This document explains the logic behind the `astro-picture-content/fetch_image_from_aws` API call, which is a core part of the "V2" Western Horoscope report system.

## 1. Purpose: Why is it called?
The primary goal of this API is to fetch **pictorial representations** of specific astrological configurations. Instead of showing only text, the system provides a "premium" experience by displaying visual assets (stored in AWS S3) that illustrate:
- A specific planet in a specific zodiac sign.
- A specific aspect (angle) between two planets.
- A specific house placement.

## 2. Trigger: When is it called?
The API is called **on-demand** to optimize performance. It is generally triggered when a user requests more detail about a specific report item:

- **Action**: User clicks the "Show More" button in a result table.
- **Workflow**: 
    1. The component (e.g., `CommonTabilLilithComponent` or `CommonTabilAspectsComponent`) identifies the selected astrological item.
    2. It executes a local `fetchPicture()` function.
    3. The API is called *simultaneously* with the AI text generation request.
    4. The resulting image URL is stored and then displayed inside information modals like `showMoreModal` or `showMoreModalAsecdent`.

## 3. Implementation: What work is done?

### A. Payload Construction (Frontend)
The frontend generates a unique key (filename) based on the astrological data. This key must match the naming convention of files stored in the AWS S3 bucket.

| Category | Filename Pattern | Example | Folder |
| :--- | :--- | :--- | :--- |
| **Planets** | `{PlanetName}-In-{SignName}` | `Sun-In-Virgo` | `planets` |
| **Aspects** | `{Planet1}-{AspectType}-{Planet2}` | `Mars-Square-Pluto` | `aspect` |
| **Houses** | `{PlanetName}-In-{HouseNumber}-House-With-{SignName}` | `Sun-In-12th-House-With-Virgo` | `planets` |

### B. API Execution
The `ApiservicesService` sends a POST request:
- **Endpoint**: `astro-picture-content/fetch_image_from_aws`
- **Request Body**:
```json
{
  "filename": "Sun-In-Virgo",
  "foldername": "planets"
}
```

### C. Backend & S3 Interaction
Though the backend code is not shown here, the API's behavior indicates that it:
1. Receives the `filename` and `foldername`.
2. Locates the file within the corresponding folder in the **AWS S3 bucket**.
3. Returns a structured JSON response containing the direct URL to the image.

### D. Result Handling
If the API returns a `success` status, the frontend extracts the URL:
```typescript
if (response.status === "success") {
  this.pictorialData = response.data.url; // Or the whole response object depending on component
}
```
The URL is then bound to the UI using Angular's property binding (`[src]`) or a custom lazy loader directive (`[appImageLazyLoader]`).

## 4. Error Handling
- If no matching image is found in AWS, the API returns an error status.
- The frontend displays a "No Record Found" snackbar notification.
- The modal proceeds to display the text-only AI interpretation without the visual asset.


## API Backend LOGIC 


# AWS S3 Image Fetch API Logic Guide

This document describes the core logic for the `astro-picture-content/fetch_image_from_aws` API and its required environment configurations.

## 1. Required Environment Variables

The implementation depends on the following keys being defined in your environment:

| Variable | Description |
| :--- | :--- |
| `AWS_ACCESS_KEY` | AWS IAM Access Key ID with S3 read permissions. |
| `AWS_SECRET_KEY` | AWS IAM Secret Access Key. |

---

## 2. Core Logic

The primary functionality is implemented in the following methods. It uses the `aws-sdk` to interact with S3 and implements a fallback mechanism to handle naming variations in the bucket.

### S3 URL Generation and Validation

This method checks if an object exists in the S3 bucket and returns the signed URL if the object is found.

```typescript
async getFileUrl(bucketName: string, key: string) {
    try {
        AWS.config.update({
            accessKeyId: this.configService.get<string>('MAIL_SEND_AWS_ACCESS_KEY'),
            secretAccessKey: this.configService.get<string>('MAIL_SEND_AWS_SECRET_KEY'),
            region: "us-east-1" // Region is hardcoded to us-east-1
        });

        const s3 = new AWS.S3();
        // Check if the object exists in the bucket
        await s3.headObject({ Bucket: bucketName, Key: key }).promise();
        
        // Return the constructed S3 URL
        return `https://${bucketName}.s3.${s3.config.region}.amazonaws.com/${key}`;
    } catch (error) {
        if (error.code === "NotFound") {
            return null; // Return null if file doesn't exist to trigger fallback
        }
        throw error;
    }
}
```

### Main Fetch Logic with Fallback Naming

This method processes the request, attempting to find a file with the given name, and provides automatic recovery if common naming variations (Conjunction vs. Conjunct) are used.

```typescript
async fetchImageFromAws(data: { foldername: string, filename: string }): Promise<any> {
    try {
        const basePath = data.foldername;
        const originalFilename = data.filename;
        const bucketName = "divineastroimage";

        // Step 1: Attempt to fetch the primary URL
        let url = await this.getFileUrl(bucketName, `${basePath}/${originalFilename}.jpg`);

        // Step 2: Fallback Logic for naming variations
        if (!url && originalFilename.includes("Conjunction")) {
            // If primary name using 'Conjunction' fails, try 'Conjunct'
            const fallbackFilename = originalFilename.replace("Conjunction", "Conjunct");
            url = await this.getFileUrl(bucketName, `${basePath}/${fallbackFilename}.jpg`);
        } else if (!url && originalFilename.includes("Conjunct")) {
            // If primary name using 'Conjunct' fails, try 'Conjunction'
            const fallbackFilename = originalFilename.replace("Conjunct", "Conjunction");
            url = await this.getFileUrl(bucketName, `${basePath}/${fallbackFilename}.jpg`);
        }

        return { url: url };
    } catch (error) {
        return Promise.reject(error);
    }
}
```

---

## 3. API Input/Output Examples

### Request Payload:
```json
{
  "foldername": "zodiac-icons",
  "filename": "Sun-Conjunction-Moon"
}
```

### Response:
```json
{
  "status": "success",
  "data": {
    "url": "https://divineastroimage.s3.us-east-1.amazonaws.com/zodiac-icons/Sun-Conjunction-Moon.jpg"
  }
}
```

