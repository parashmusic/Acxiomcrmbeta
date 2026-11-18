import { Customer, CustomerStatus } from "@prisma/client";

export interface CustomerDto {
  id: string;
  customerCode: string;
  customerName: string;
  email: string;
  phone: string;
  companyName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  status: CustomerStatus;
  notes: string | null;
  assignedToId: string | null;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdById: string | null;
  createdBy?: {
    id: string;
    name: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toCustomerDto(
  customer: Customer & {
    assignedTo?: { id: string; name: string | null; email: string } | null;
    createdBy?: { id: string; name: string | null } | null;
  }
): CustomerDto {
  return {
    id: customer.id,
    customerCode: customer.customerCode,
    customerName: customer.customerName,
    email: customer.email,
    phone: customer.phone,
    companyName: customer.companyName,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    status: customer.status,
    notes: customer.notes,
    assignedToId: customer.assignedToId,
    assignedTo: customer.assignedTo ?? null,
    createdById: customer.createdById,
    createdBy: customer.createdBy ?? null,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}
