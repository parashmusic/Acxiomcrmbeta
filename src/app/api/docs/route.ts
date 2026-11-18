import { NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "AcxiomCRM API",
    version: "1.0.0",
    description: "Role-based CRM web application REST API specification.",
  },
  servers: [{ url: "/", description: "Current environment" }],
  paths: {
    "/api/auth/login": {
      post: {
        summary: "Authenticate user and receive token/profile",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          200: { description: "Authenticated successfully" },
          400: { description: "Validation error" },
          401: { description: "Invalid credentials or account locked" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "Terminate active session",
        responses: { 200: { description: "Logged out" } },
      },
    },
    "/api/customers": {
      get: {
        summary: "List/search customers with role-based scoping",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE"] } },
        ],
        responses: { 200: { description: "Paginated customer list" }, 401: { description: "Unauthorized" } },
      },
      post: {
        summary: "Create a new customer",
        responses: { 201: { description: "Customer created" }, 400: { description: "Validation error" }, 409: { description: "Duplicate customer" } },
      },
    },
    "/api/customers/{id}": {
      get: { summary: "Get customer details by ID", responses: { 200: { description: "Customer found" }, 404: { description: "Not found" } } },
      put: { summary: "Update customer", responses: { 200: { description: "Updated" }, 400: { description: "Validation error" }, 404: { description: "Not found" } } },
      delete: { summary: "Deactivate customer", responses: { 200: { description: "Deactivated" }, 404: { description: "Not found" } } },
    },
    "/api/leads": {
      get: { summary: "List/search leads with role-based scoping", responses: { 200: { description: "Paginated leads" } } },
      post: { summary: "Create lead", responses: { 201: { description: "Lead created" } } },
    },
    "/api/leads/{id}": {
      get: { summary: "Get lead by ID", responses: { 200: { description: "Lead found" } } },
      put: { summary: "Update lead", responses: { 200: { description: "Updated" } } },
      delete: { summary: "Delete lead", responses: { 200: { description: "Deleted" } } },
    },
    "/api/opportunities": {
      get: { summary: "List/search opportunities", responses: { 200: { description: "Opportunities list" } } },
      post: { summary: "Create opportunity", responses: { 201: { description: "Created" } } },
    },
    "/api/opportunities/{id}": {
      get: { summary: "Get opportunity by ID", responses: { 200: { description: "Found" } } },
      put: { summary: "Update opportunity", responses: { 200: { description: "Updated" } } },
      delete: { summary: "Delete opportunity", responses: { 200: { description: "Deleted" } } },
    },
    "/api/followups": {
      get: { summary: "List follow-ups", responses: { 200: { description: "Follow-ups list" } } },
      post: { summary: "Create follow-up", responses: { 201: { description: "Created" } } },
    },
    "/api/reports/pipeline": {
      get: { summary: "Pipeline report by stage and owner", responses: { 200: { description: "Pipeline data" } } },
    },
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("format") === "json") {
    return NextResponse.json(openApiSpec);
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>AcxiomCRM API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body style="margin:0;padding:0;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
      });
    };
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
