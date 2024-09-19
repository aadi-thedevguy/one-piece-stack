import { Link } from '@remix-run/react'
import { Skull } from 'lucide-react'

export default function Navbar({ children }: { children: React.ReactNode }) {
	return (
		<header className='supports-backdrop-blur:bg-white/60 mb-12 top-0 z-50 flex h-20 w-screen flex-wrap items-center justify-between px-4 py-4 shadow-sm shadow-gray-200 backdrop-blur dark:bg-transparent dark:shadow-gray-700 sm:px-6 lg:px-8'>
			<div className='relative flex flex-grow basis-0 items-center'>
				<Link aria-label='Home page' to='/'>
					<img
						className='flex h-8'
						src='https://raw.githubusercontent.com/i4o-oss/rescribe/main/docs/public/rescribe_logo.png'
						alt='logo'
					/>
				</Link>
			</div>
			<div className='flex flex-grow items-center justify-end gap-4'>
				<a
					className='text-black dark:text-gray-100'
					href='https://thedevguy.in'
					rel='noreferrer noopener'
					target='_blank'
				>
					<Skull />
				</a>
				{children}
			</div>
		</header>
	)
}
