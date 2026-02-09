'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { resetPassword, type ResetPasswordState } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';
import { KeyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const initialState: ResetPasswordState = { message: '', errors: {} };
  const [state, dispatch] = useActionState(resetPassword, initialState);

  if (!token) {
    return (
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className="mb-3 text-2xl font-bold">Invalid Reset Link</h1>
        <p className="text-sm text-gray-600">
          This password reset link is invalid or has expired.
        </p>
      </div>
    );
  }

  return (
    <form action={dispatch} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className="mb-3 text-2xl font-bold">Reset your password</h1>
        <p className="mb-4 text-sm text-gray-600">
          Enter your new password below.
        </p>
        
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="password"
            >
              New Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type="password"
                name="password"
                placeholder="Enter new password"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            {state.errors?.password && (
              <div className="mt-2 text-sm text-red-500">
                {state.errors.password.map((error: string) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="confirmPassword"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>
        
        <ResetPasswordButton />
        
        {state.message && (
          <div className="mt-2 flex items-center space-x-1">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">{state.message}</p>
          </div>
        )}
      </div>
    </form>
  );
}

function ResetPasswordButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="mt-4 w-full" aria-disabled={pending}>
      Reset password <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
    </Button>
  );
}