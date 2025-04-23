
import { z } from 'zod';

export const fundSchema = z.object({
  amount: z.string()
    .refine((value) => !isNaN(Number(value)), {
      message: 'Amount must be a number',
    })
    .refine((value) => Number(value) > 0, {
      message: 'Amount must be greater than 0',
    }),
  currency: z.string().default('USD'),
  paymentMethod: z.string(),
  screenshot: z.instanceof(File).optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions"
  })
});

export type FundFormValues = z.infer<typeof fundSchema>;
