import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { useState } from 'react'
import { data, redirect, Form, useNavigation } from 'react-router'
import { z } from 'zod'
import { ErrorList } from '~/components/layout/forms.js'
import { Button } from '~/components/ui/button.js'
import { StatusButton } from '~/components/layout/status-button.js'
import { requireUserId } from '~/lib/auth/auth.server.js'
import { prisma } from '~/lib/db.server.js'
import {
	useDoubleCheck,
	useIsPending
} from '~/lib/utils'
import { type BreadcrumbHandle } from '~/lib/validations/index.js'
import { validateCSRF } from '~/lib/csrf.server'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { AvatarIcon } from '@radix-ui/react-icons'
import { Pencil, TrashIcon } from 'lucide-react'
import type { Route } from './+types/profile.photo'
import {deleteFile, uploadFile} from "~/lib/upload.server";
import { placeholderAvatar } from '~/constants/keys'
import { redirectWithToast } from '~/lib/toast.server'

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
	filename: z.string(),
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

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			username: true,
			image: { select: { id: true, url: true, filename: true } },
		},
	})
	invariantResponse(user, 'User not found', { status: 404 })
	return { user }
}

export async function action({ request }: Route.ActionArgs) {
    const userId = await requireUserId(request);

    const formData = await request.formData();
    await validateCSRF(formData, request.headers);

    const submission = await parseWithZod(formData, {
        schema: PhotoFormSchema.transform(async (data) => {
            if (data.intent === 'delete') return { intent: 'delete', filename: data.filename };
            if (data.photoFile.size <= 0) return z.NEVER;
            return {
                intent: data.intent,
                image: data.photoFile
            };
        }),
        async: true,
    });

    if (submission.status !== 'success') {
        return data(
            { result: submission.reply() },
            { status: submission.status === 'error' ? 400 : 200 },
        );
    }

    const { image, intent, filename } = submission.value;

    if (intent === 'delete') {
		const deleted = await deleteFile(filename);
		if (deleted) await prisma.userImage.deleteMany({ where: { userId } })
        return redirect('/settings/profile');
    }

		const {url, error} = await uploadFile(image)

		if (error) {
			throw await redirectWithToast('/settings/profile/photo', {
				type: 'error',
				title: 'Upload Failed',
				description: error,
			})
		}
		await prisma.$transaction([
			prisma.userImage.deleteMany({ where: { userId } }),
			prisma.user.update({
				where: { id: userId },
				data: { image: { create: { url, contentType: image?.type ?? 'image/jpg', filename: image?.name || '' } } },
			})
		])
	

    return redirect('/settings/profile');
}

export default function PhotoRoute({
	loaderData,
	actionData,
} : Route.ComponentProps) {
	const doubleCheckDeleteImage = useDoubleCheck()

	const navigation = useNavigation()

	const [form, fields] = useForm({
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
		<div>
			<Form
				method="POST"
				encType="multipart/form-data"
				className="flex flex-col items-center justify-center gap-10"
				onReset={() => setNewImageSrc(null)}
				{...getFormProps(form)}
			>
			<AuthenticityTokenInput />
			<input type="hidden" name="filename" value={loaderData.user?.image?.filename || ''} />
				<img
					src={
						newImageSrc ??
						(loaderData.user.image?.url || placeholderAvatar)
					}
					className="h-52 w-52 rounded-full object-cover"
					alt={loaderData.user?.name ?? loaderData.user?.username}
				/>
				<ErrorList errors={fields.photoFile.errors} id={fields.photoFile.id} />
				<div className="flex gap-4">
					{/*
						We're doing some kinda odd things to make it so this works well
						without JavaScript. Basically, we're using CSS to ensure the right
						buttons show up based on the input's "valid" state (whether or not
						an image has been selected). Progressive enhancement FTW!
					*/}
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
					<Button
						asChild
						className="cursor-pointer peer-valid:hidden peer-focus-within:ring-2 peer-focus-visible:ring-2"
					>
						<label className='flex items-center gap-1' htmlFor={fields.photoFile.id}>
                        <Pencil className='h-4 w-4' />
                        <span>Change</span>
						</label>
					</Button>
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
					{loaderData.user.image?.id ? (
						<StatusButton
							className="peer-valid:hidden"
							variant="destructive"
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
							{/* <TrashIcon className='h-4 w-4' /> */}
						<span>{doubleCheckDeleteImage.doubleCheck
							? 'Are you sure?'
							: 'Delete'}</span>
						</StatusButton>
					) : null}
				</div>
				<ErrorList errors={form.errors} />
			</Form>
		</div>
	)
}
