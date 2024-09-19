import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import {
	json,
	redirect,
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import {
	Form,
	useActionData,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { ErrorList } from '~/components/layout/forms'
import { StatusButton } from '~/components/layout/status-button'
import { Button } from '~/components/ui/button'
import { requireUserId } from '~/lib/auth/auth.server'
import { prisma } from '~/lib/db.server'
import {
	getUserImgSrc,
	useDoubleCheck,
	useIsPending,
} from '~/lib/utils'
import { type BreadcrumbHandle } from '~/lib/validations'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { AvatarIcon } from '@radix-ui/react-icons'
import { validateCSRF } from '~/lib/csrf.server'
import { Pencil, TrashIcon } from 'lucide-react'

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <div className='flex items-center gap-2'>
		<AvatarIcon className='h-4 w-4' />
		<span>Photo</span>
	</div>,
	getSitemapEntries: () => null,
}

const MAX_SIZE = 1024 * 1024 * 3 // 3MB

const DeleteImageSchema = z.object({
	intent: z.literal('delete'),
})

const NewImageSchema = z.object({
	intent: z.literal('submit'),
	photoFile: z
		.instanceof(File)
		.refine((file) => file.size > 0, 'Image is required')
		.refine(
			(file) => file.size <= MAX_SIZE,
			'Image size must be less than 3MB',
		),
})

const PhotoFormSchema = z.discriminatedUnion('intent', [
	DeleteImageSchema,
	NewImageSchema,
])

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			username: true,
			image: { select: { id: true } },
		},
	})
	invariantResponse(user, 'User not found', { status: 404 })
	return json({ user })
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)

	const formData = await unstable_parseMultipartFormData(
		request,
		unstable_createMemoryUploadHandler({ maxPartSize: MAX_SIZE }),
	)
	// const formData = await unstable_parseMultipartFormData(
	// 	request,
	// 	uploadHandler
	// )
	// const file = formData.get('image')?.toString() || ''
	await validateCSRF(formData, request.headers)
	const submission = await parseWithZod(formData, {
		schema: PhotoFormSchema.transform(async (data) => {
			if (data.intent === 'delete') return { intent: 'delete' }
			if (data.photoFile.size <= 0) return z.NEVER
			return {
				intent: data.intent,
				image: {
					contentType: data.photoFile.type,
					blob: Buffer.from(await data.photoFile.arrayBuffer()),
				},
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { image, intent } = submission.value

	if (intent === 'delete') {
		await prisma.userImage.deleteMany({ where: { userId } })
		return redirect('/settings/profile')
	}

	await prisma.$transaction(async ($prisma) => {
		await $prisma.userImage.deleteMany({ where: { userId } })
		await $prisma.user.update({
			where: { id: userId },
			data: { image: { create: image } },
		})
	})

	return redirect('/settings/profile')
}

export default function PhotoRoute() {
	const data = useLoaderData<typeof loader>()

	const doubleCheckDeleteImage = useDoubleCheck()

	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()

	const [
		form,
		fields] = useForm({
			id: 'profile-photo',
			constraint: getZodConstraint(PhotoFormSchema),
			lastResult: actionData?.result,
			onValidate({ formData }) {
				return parseWithZod(formData, { schema: PhotoFormSchema })
			},
			shouldRevalidate: 'onBlur',
		})

	const isPending = useIsPending()
	const pendingIntent = isPending ? navigation.formData?.get('intent') : null
	const lastSubmissionIntent = fields.intent.value

	const [newImageSrc, setNewImageSrc] = useState<string | null>(null)

	return (
		<Form
			method="POST"
			encType="multipart/form-data"
			className="flex flex-col items-center justify-center gap-10"
			onReset={() => setNewImageSrc(null)}
			{...getFormProps(form)}
		>
			<AuthenticityTokenInput />
			<img
				src={
					newImageSrc ?? (data.user ? getUserImgSrc(data.user.image?.id) : '')
				}
				className="h-52 w-52 rounded-full object-cover"
				alt={data.user?.name ?? data.user?.username}
			/>
			<ErrorList errors={fields.photoFile.errors} id={fields.photoFile.id} />
			<div className="flex gap-4">
				<input
					{...getInputProps(fields.photoFile, { type: 'file' })}
					accept="image/*"
					className="peer sr-only"
					required
					tabIndex={newImageSrc ? -1 : 0}
					onChange={(e) => {
						const file = e.currentTarget.files?.[0]
						if (file) {
							const reader = new FileReader()
							reader.onload = (event) => {
								setNewImageSrc(event.target?.result?.toString() ?? null)
							}
							reader.readAsDataURL(file)
						}
					}}
				/>
				{/* TODO: Fix below error */}
				{/* <Button
					asChild
					className="cursor-pointer peer-valid:hidden peer-focus-within:ring-2 peer-focus-visible:ring-2"
				>
					<Pencil className='h-4 w-4' />
					<label htmlFor={fields.photoFile.id}>
						Change
					</label>
				</Button> */}
				<StatusButton
					name="intent"
					value="submit"
					type="submit"
					className="peer-invalid:hidden"
					status={
						pendingIntent === 'submit'
							? 'pending'
							: lastSubmissionIntent === 'submit'
								? (form.status ?? 'idle')
								: 'idle'
					}
				>
					Save Photo
				</StatusButton>
				<Button
					variant="destructive"
					className="peer-invalid:hidden"
					{...form.reset.getButtonProps()}
				>
					<TrashIcon className='h-4 w-4' />
					<span>Reset</span>
				</Button>
				{data.user.image?.id ? (
					<StatusButton
						className="inline-flex peer-valid:hidden"
						// variant="destructive"
						{...doubleCheckDeleteImage.getButtonProps({
							type: 'submit',
							name: 'intent',
							value: 'delete',
						})}
						status={
							pendingIntent === 'delete'
								? 'pending'
								: lastSubmissionIntent === 'delete'
									? (form.status ?? 'idle')
									: 'idle'
						}
					>
						<TrashIcon className='h-4 w-4' />
						<span>{doubleCheckDeleteImage.doubleCheck
							? 'Are you sure?'
							: 'Delete'}</span>

					</StatusButton>
				) : null}
			</div>
			<ErrorList errors={form.errors} />
		</Form>
	)
}
