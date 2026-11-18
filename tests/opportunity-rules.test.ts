import { describe, it, expect } from "vitest";
import { createOpportunitySchema } from "@/schemas/opportunity.schema";
import { OpportunityStage, OpportunityStatus } from "@prisma/client";
import { subDays, addDays } from "date-fns";

describe("Opportunity Business Rules", () => {
  const validFutureDate = addDays(new Date(), 10);
  const pastDate = subDays(new Date(), 2);

  it("accepts valid opportunity parameters", () => {
    const res = createOpportunitySchema.safeParse({
      opportunityName: "Big Enterprise Deal",
      customerId: "cust-1",
      amount: 500000,
      stage: OpportunityStage.QUALIFICATION,
      probability: 25,
      expectedCloseDate: validFutureDate,
      status: OpportunityStatus.OPEN,
    });
    expect(res.success).toBe(true);
  });

  it("rejects non-positive amounts for active opportunities", () => {
    const zeroAmount = createOpportunitySchema.safeParse({
      opportunityName: "Zero Deal",
      customerId: "cust-1",
      amount: 0,
      stage: OpportunityStage.QUALIFICATION,
      probability: 25,
      expectedCloseDate: validFutureDate,
      status: OpportunityStatus.OPEN,
    });
    expect(zeroAmount.success).toBe(false);

    const negativeAmount = createOpportunitySchema.safeParse({
      opportunityName: "Negative Deal",
      customerId: "cust-1",
      amount: -100,
      stage: OpportunityStage.QUALIFICATION,
      probability: 25,
      expectedCloseDate: validFutureDate,
      status: OpportunityStatus.OPEN,
    });
    expect(negativeAmount.success).toBe(false);
  });

  it("rejects probability outside 0 - 100 range", () => {
    const over100 = createOpportunitySchema.safeParse({
      opportunityName: "Over 100",
      customerId: "cust-1",
      amount: 1000,
      stage: OpportunityStage.QUALIFICATION,
      probability: 105,
      expectedCloseDate: validFutureDate,
      status: OpportunityStatus.OPEN,
    });
    expect(over100.success).toBe(false);

    const under0 = createOpportunitySchema.safeParse({
      opportunityName: "Under 0",
      customerId: "cust-1",
      amount: 1000,
      stage: OpportunityStage.QUALIFICATION,
      probability: -5,
      expectedCloseDate: validFutureDate,
      status: OpportunityStatus.OPEN,
    });
    expect(under0.success).toBe(false);
  });

  it("rejects past expected close date for active deals", () => {
    const res = createOpportunitySchema.safeParse({
      opportunityName: "Past Date Deal",
      customerId: "cust-1",
      amount: 1000,
      stage: OpportunityStage.QUALIFICATION,
      probability: 50,
      expectedCloseDate: pastDate,
      status: OpportunityStatus.OPEN,
    });
    expect(res.success).toBe(false);
  });
});

