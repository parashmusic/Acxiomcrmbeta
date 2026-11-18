import { describe, it, expect } from "vitest";
import { isValidLeadTransition } from "@/schemas/lead.schema";
import { LeadStatus } from "@prisma/client";

describe("Lead Status Transition State Machine", () => {
  it("allows valid transitions from NEW", () => {
    expect(isValidLeadTransition(LeadStatus.NEW, LeadStatus.CONTACTED)).toBe(true);
    expect(isValidLeadTransition(LeadStatus.NEW, LeadStatus.LOST)).toBe(true);
    expect(isValidLeadTransition(LeadStatus.NEW, LeadStatus.QUALIFIED)).toBe(false);
    expect(isValidLeadTransition(LeadStatus.NEW, LeadStatus.CONVERTED)).toBe(false);
  });

  it("allows valid transitions from CONTACTED", () => {
    expect(isValidLeadTransition(LeadStatus.CONTACTED, LeadStatus.QUALIFIED)).toBe(true);
    expect(isValidLeadTransition(LeadStatus.CONTACTED, LeadStatus.UNQUALIFIED)).toBe(true);
    expect(isValidLeadTransition(LeadStatus.CONTACTED, LeadStatus.LOST)).toBe(true);
    expect(isValidLeadTransition(LeadStatus.CONTACTED, LeadStatus.CONVERTED)).toBe(false);
  });

  it("allows valid transitions from QUALIFIED", () => {
    expect(isValidLeadTransition(LeadStatus.QUALIFIED, LeadStatus.CONVERTED)).toBe(true);
    expect(isValidLeadTransition(LeadStatus.QUALIFIED, LeadStatus.LOST)).toBe(true);
    expect(isValidLeadTransition(LeadStatus.QUALIFIED, LeadStatus.NEW)).toBe(false);
  });

  it("treats CONVERTED and LOST as terminal stages", () => {
    expect(isValidLeadTransition(LeadStatus.CONVERTED, LeadStatus.QUALIFIED)).toBe(false);
    expect(isValidLeadTransition(LeadStatus.CONVERTED, LeadStatus.NEW)).toBe(false);
    expect(isValidLeadTransition(LeadStatus.LOST, LeadStatus.NEW)).toBe(false);
    expect(isValidLeadTransition(LeadStatus.LOST, LeadStatus.CONTACTED)).toBe(false);
  });
});

