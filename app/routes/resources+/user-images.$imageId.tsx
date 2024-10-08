import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { prisma } from '~/lib/db.server'
import { downloadFile } from '~/lib/utils'

export async function loader({ params }: LoaderFunctionArgs) {
	invariantResponse(params.imageId, 'Image ID is required', { status: 400 })
	const image = await prisma.userImage.findUnique({
		where: { id: params.imageId },
		select: { contentType: true, url: true },
	})

	invariantResponse(image, 'Not found', { status: 404 })
	const { blob } = await downloadFile(image.url)

	// return new Response(image.blob, {
	// 	headers: {
	// 		'Content-Type': image.contentType,
	// 		'Content-Length': Buffer.byteLength(image.blob).toString(),
	// 		'Content-Disposition': `inline; filename="${params.imageId}"`,
	// 		'Cache-Control': 'public, max-age=31536000, immutable',
	// 	},
	// })
	return new Response(blob, {
		headers: {
			'Content-Type': image.contentType,
			'Content-Length': Buffer.byteLength(blob).toString(),
			'Content-Disposition': `inline; filename="${params.imageId}"`,
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
