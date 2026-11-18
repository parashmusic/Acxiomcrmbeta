import { PrismaClient, Role, CustomerStatus, LeadStatus, LeadPriority, LeadSource, OpportunityStage, OpportunityStatus, FollowUpStatus, FollowUpType, ActivityType, ActivityStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password@123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@acxiom.com",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Sales Manager",
      email: "manager@acxiom.com",
      passwordHash,
      role: Role.MANAGER,
      isActive: true,
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@acxiom.com",
      passwordHash,
      role: Role.SALES_EXECUTIVE,
      isActive: true,
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      name: "Rahul Verma",
      email: "rahul@acxiom.com",
      passwordHash,
      role: Role.SALES_EXECUTIVE,
      isActive: true,
    },
  });

  const customer1 = await prisma.customer.create({
    data: {
      customerCode: "CUS-0001",
      customerName: "Infosys Technologies",
      email: "procurement@infosys.com",
      phone: "9876543210",
      companyName: "Infosys Ltd",
      address: "Electronics City, Hosur Road",
      city: "Bengaluru",
      state: "Karnataka",
      status: CustomerStatus.ACTIVE,
      notes: "Key enterprise client.",
      assignedToId: sales1.id,
      createdById: admin.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerCode: "CUS-0002",
      customerName: "Tata Consultancy Services",
      email: "vendor@tcs.com",
      phone: "9812345678",
      companyName: "TCS Global",
      address: "TCS House, Raveline Street",
      city: "Mumbai",
      state: "Maharashtra",
      status: CustomerStatus.ACTIVE,
      notes: "Annual software subscription account.",
      assignedToId: sales2.id,
      createdById: manager.id,
    },
  });

  const lead1 = await prisma.lead.create({
    data: {
      leadCode: "LED-0001",
      leadName: "Wipro Technologies",
      email: "cloud@wipro.com",
      phone: "9845012345",
      companyName: "Wipro Ltd",
      source: LeadSource.WEBSITE,
      status: LeadStatus.QUALIFIED,
      priority: LeadPriority.HIGH,
      expectedValue: 500000.0,
      notes: "Ready for enterprise CRM rollout evaluation.",
      assignedToId: sales1.id,
      createdById: sales1.id,
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      leadCode: "LED-0002",
      leadName: "HCL Technologies",
      email: "contact@hcl.com",
      phone: "9711223344",
      companyName: "HCL Tech",
      source: LeadSource.REFERRAL,
      status: LeadStatus.CONTACTED,
      priority: LeadPriority.MEDIUM,
      expectedValue: 350000.0,
      notes: "Initial discovery call conducted.",
      assignedToId: sales2.id,
      createdById: manager.id,
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      leadCode: "LED-0003",
      leadName: "Tech Mahindra",
      email: "sales@techmahindra.com",
      phone: "9655443322",
      companyName: "Tech Mahindra Ltd",
      source: LeadSource.EMAIL_CAMPAIGN,
      status: LeadStatus.NEW,
      priority: LeadPriority.LOW,
      expectedValue: 200000.0,
      notes: "Web inquiry through campaign.",
      assignedToId: sales1.id,
      createdById: admin.id,
    },
  });

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const opp1 = await prisma.opportunity.create({
    data: {
      opportunityName: "Infosys Cloud CRM Expansion",
      customerId: customer1.id,
      amount: 1200000.0,
      stage: OpportunityStage.PROPOSAL,
      probability: 60,
      expectedCloseDate: futureDate,
      status: OpportunityStatus.OPEN,
      source: LeadSource.REFERRAL,
      notes: "Formal proposal submitted to procurement.",
      assignedToId: sales1.id,
    },
  });

  const opp2 = await prisma.opportunity.create({
    data: {
      opportunityName: "TCS Enterprise License Renewal",
      customerId: customer2.id,
      amount: 2500000.0,
      stage: OpportunityStage.NEGOTIATION,
      probability: 80,
      expectedCloseDate: futureDate,
      status: OpportunityStatus.OPEN,
      source: LeadSource.WEBSITE,
      notes: "Contract negotiations in final legal review.",
      assignedToId: sales2.id,
    },
  });

  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 3);

  await prisma.followUp.create({
    data: {
      customerId: customer1.id,
      opportunityId: opp1.id,
      followUpDate,
      subject: "Follow-up on RFP submission",
      followUpType: FollowUpType.CALL,
      remarks: "Call procurement lead Mr. Sharma.",
      status: FollowUpStatus.PLANNED,
      assignedToId: sales1.id,
    },
  });

  await prisma.followUp.create({
    data: {
      leadId: lead1.id,
      followUpDate,
      subject: "Conversion discussion meeting",
      followUpType: FollowUpType.MEETING,
      remarks: "Review customer conversion terms.",
      status: FollowUpStatus.PLANNED,
      assignedToId: sales1.id,
    },
  });

  await prisma.activity.create({
    data: {
      activityType: ActivityType.CALL,
      subject: "Initial introduction call",
      description: "Discussed company requirements and timelines.",
      activityDate: new Date(),
      customerId: customer1.id,
      assignedToId: sales1.id,
      status: ActivityStatus.COMPLETED,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "DATABASE_SEEDED",
      module: "SYSTEM",
      entityName: "System",
      result: "SUCCESS",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
