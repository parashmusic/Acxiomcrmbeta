import { describe, it, expect } from "vitest";
import { createFollowUpSchema } from "@/schemas/followup.schema";
import { FollowUpStatus, FollowUpType } from "@prisma/client";
import { subDays, addDays } from "date-fns";

describe("Follow-Up Business Rules", () => {
  const tomorrow = addDays(new Date(), 1);
  const yesterday = subDays(new Date(), 2);

  it("accepts valid planned follow-up for future date", () => {
    const res = createFollowUpSchema.safeParse({
      customerId: "cust-1",
      subject: "Demo Discussion",
      followUpType: FollowUpType.CALL,
      followUpDate: tomorrow,
      status: FollowUpStatus.PLANNED,
    });
    expect(res.success).toBe(true);
  });

  it("rejects follow-up dated before today for planned status", () => {
    const res = createFollowUpSchema.safeParse({
      customerId: "cust-1",
      subject: "Past Meeting",
      followUpType: FollowUpType.MEETING,
      followUpDate: yesterday,
      status: FollowUpStatus.PLANNED,
    });
    expect(res.success).toBe(false);
  });

  it("rejects follow-up without linked customer, lead, or opportunity", () => {
    const res = createFollowUpSchema.safeParse({
      subject: "Unlinked Task",
      followUpType: FollowUpType.TASK,
      followUpDate: tomorrow,
      status: FollowUpStatus.PLANNED,
    });
    expect(res.success).toBe(false);
  });
});

