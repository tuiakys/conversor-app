import AcmeLogo from '@/app/ui/acme-logo';
import SignUpForm from '@/app/ui/signup-form';
import Link from 'next/link';
 
export default function SignUpPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <SignUpForm />
        
        <div className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link 
            href="/login"
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}