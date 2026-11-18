import { z } from "zod";
import { CustomerStatus } from "@prisma/client";

export const indianPhoneRegex = /^[6-9]\d{9}$/;

export const createCustomerSchema = z.object({
  customerName: z
    .string()
    .min(2, "Customer name must be at least 2 characters.")
    .max(100, "Customer name cannot exceed 100 characters."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().regex(indianPhoneRegex, "Enter a valid phone number."),
  companyName: z.string().max(100, "Company name cannot exceed 100 characters.").optional().nullable(),
  address: z.string().max(250, "Address cannot exceed 250 characters.").optional().nullable(),
  city: z.string().max(100, "City cannot exceed 100 characters.").optional().nullable(),
  state: z.string().max(100, "State cannot exceed 100 characters.").optional().nullable(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters.").optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  status: z.nativeEnum(CustomerStatus).optional(),
});

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  assignedToId: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
