import { describe, it, expect } from "vitest";
import { passwordSchema, registerSchema } from "@/schemas/user.schema";
import { createCustomerSchema } from "@/schemas/customer.schema";

describe("Validation Schemas", () => {
  describe("Password Policy", () => {
    it("accepts valid passwords meeting all criteria", () => {
      expect(passwordSchema.safeParse("Pass@1234").success).toBe(true);
      expect(passwordSchema.safeParse("Complex#Password9").success).toBe(true);
    });

    it("rejects passwords shorter than 8 characters", () => {
      const res = passwordSchema.safeParse("P@1a");
      expect(res.success).toBe(false);
    });

    it("rejects passwords missing uppercase", () => {
      const res = passwordSchema.safeParse("password@123");
      expect(res.success).toBe(false);
    });

    it("rejects passwords missing lowercase", () => {
      const res = passwordSchema.safeParse("PASSWORD@123");
      expect(res.success).toBe(false);
    });

    it("rejects passwords missing digit", () => {
      const res = passwordSchema.safeParse("Password@Special");
      expect(res.success).toBe(false);
    });

    it("rejects passwords missing special characters", () => {
      const res = passwordSchema.safeParse("Password123");
      expect(res.success).toBe(false);
    });
  });

  describe("Customer Validation", () => {
    it("accepts valid 10-digit Indian phone numbers starting with 6-9", () => {
      const valid = createCustomerSchema.safeParse({
        customerName: "Acme Corp",
        email: "test@acme.com",
        phone: "9876543210",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      const invalidPrefix = createCustomerSchema.safeParse({
        customerName: "Acme Corp",
        email: "test@acme.com",
        phone: "1234567890",
      });
      expect(invalidPrefix.success).toBe(false);

      const invalidLength = createCustomerSchema.safeParse({
        customerName: "Acme Corp",
        email: "test@acme.com",
        phone: "987654321",
      });
      expect(invalidLength.success).toBe(false);
    });
  });
});

