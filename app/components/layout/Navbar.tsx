import { Link } from 'react-router'
import { Button } from '../ui/button'

export default function Navbar({ children }: { children: React.ReactNode }) {
	return (
		<header className='supports-backdrop-blur:bg-white/60 mb-12 top-0 z-50 flex h-20 w-screen flex-wrap items-center justify-between px-4 py-4 shadow-xs shadow-gray-200 backdrop-blur-sm dark:bg-transparent dark:shadow-gray-700 sm:px-6 lg:px-8'>
			<div className='flex items-center'>
				<Link to='/' aria-label='Home page'>
					<Button variant='link' size='lg'>
						Home{' '}
					</Button>
				</Link>
				<Link aria-label='Pricing Page' to='/plans'>
					<Button variant='link' size='lg'>
						Pricing
					</Button>
				</Link>
			</div>
			<div className='flex grow items-center justify-end gap-4'>
				{children}
			</div>
		</header>
	)
}
