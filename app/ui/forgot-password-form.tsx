'use client';

import { useFormStatus } from 'react-dom';
import { forgotPassword, type ForgotPasswordState } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';
import { AtSymbolIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { useActionState } from 'react';

export default function ForgotPasswordForm() {
  const initialState: ForgotPasswordState = { 
    message: '', 
    errors: {}, 
    success: false 
  };
  const [state, dispatch] = useActionState(forgotPassword, initialState);

  if (state.success) {
    return (
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <div className="flex items-center space-x-2 mb-3">
          <CheckCircleIcon className="h-6 w-6 text-green-500" />
          <h1 className="text-2xl font-bold">Check your email</h1>
        </div>
        <p className="text-sm text-gray-600">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={dispatch} className="space-y-3">
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <h1 className="mb-3 text-2xl font-bold">Reset your password</h1>
        <p className="mb-4 text-sm text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
        <div className="w-full">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            {state.errors?.email && (
              <div className="mt-2 text-sm text-red-500">
                {state.errors.email.map((error: string) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}
          </div>
        </div>
        <ForgotPasswordButton />
        {state.message && !state.success && (
          <div className="mt-2 flex items-center space-x-1">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">{state.message}</p>
          </div>
        )}
      </div>
    </form>
  );
}

function ForgotPasswordButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="mt-4 w-full" aria-disabled={pending}>
      Send reset link <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
    </Button>
  );
}