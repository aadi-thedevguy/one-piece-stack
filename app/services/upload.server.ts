import type { UploadHandler } from '@remix-run/node'
import S3 from 'aws-sdk/clients/s3'

const region = process.env.MY_AWS_DEFAULT_REGION
const Bucket = process.env.MY_AWS_S3_BUCKET
const AWS_ACCESS_KEY_ID = process.env.MY_AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.MY_AWS_SECRET_ACCESS_KEY

const storage = new S3({
	region,
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY,
})

export const uploadHandler: UploadHandler = async ({
	name,
	filename,
	data,
	// userId,
	// postId,
}) => {
	if (name !== 'image') {
		return
	}

	const { Location } = await storage
		.upload({
			Bucket,
			Key: `images/${filename}`,
			Body: data,
		})
		.promise()

	return Location
}
