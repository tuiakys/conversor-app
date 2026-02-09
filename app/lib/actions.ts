'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';
import { Resend } from 'resend';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
 
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
 
  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
 
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
 
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

// ============================================
// SIGNUP ACTION
// ============================================

const SignupFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export type SignupState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string | null;
};

export async function signup(prevState: SignupState, formData: FormData) {
  const validatedFields = SignupFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Account.',
    };
  }

  const { email, password } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return {
        message: 'An account with this email already exists.',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get a default name from email
    const name = email.split('@')[0];

    // Insert new user (id will be auto-generated by uuid_generate_v4())
    await sql`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${hashedPassword})
    `;

  } catch (error: any) {
    console.error('Signup Error:', error);
    
    // PostgreSQL unique constraint violation error code
    if (error.code === '23505') {
      return {
        message: 'An account with this email already exists.',
      };
    }
    
    return {
      message: 'Database Error: Failed to Create Account.',
    };
  }

  redirect('/login?registered=true');
}

// ============================================
// FORGOT PASSWORD ACTION
// ============================================

const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

export type ForgotPasswordState = {
  errors?: {
    email?: string[];
  };
  message?: string | null;
  success?: boolean;
};

const resend = new Resend(process.env.RESEND_API_KEY);

export async function forgotPassword(
  prevState: ForgotPasswordState,
  formData: FormData
) {
  const validatedFields = ForgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please enter a valid email.',
    };
  }

  const { email } = validatedFields.data;

  try {
    // Check if user exists
    const user = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    // Always return success for security (don't reveal if email exists)
    if (user.length === 0) {
      return {
        success: true,
        message: 'If an account exists, you will receive a password reset email.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await sql`
      UPDATE users 
      SET reset_token = ${resetToken}, 
          reset_token_expiry = ${resetTokenExpiry.toISOString()}
      WHERE email = ${email}
    `;

    // Send email with Resend
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Use your verified domain in production
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    return {
      success: true,
      message: 'If an account exists, you will receive a password reset email.',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      message: 'An error occurred. Please try again.',
    };
  }
}

// ============================================
// RESET PASSWORD ACTION
// ============================================

const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordState = {
  errors?: {
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
};

export async function resetPassword(
  prevState: ResetPasswordState,
  formData: FormData
) {
  const validatedFields = ResetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
    };
  }

  const { token, password } = validatedFields.data;

  try {
    // Find user with valid token
    const result = await sql`
      SELECT id FROM users 
      WHERE reset_token = ${token} 
      AND reset_token_expiry > NOW()
    `;

    if (result.length === 0) {
      return {
        message: 'Invalid or expired reset token.',
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await sql`
      UPDATE users 
      SET password = ${hashedPassword},
          reset_token = NULL,
          reset_token_expiry = NULL
      WHERE reset_token = ${token}
    `;

  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to reset password.',
    };
  }

  redirect('/login?reset=true');
}