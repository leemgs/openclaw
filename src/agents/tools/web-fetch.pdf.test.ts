import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createWebFetchTool } from "./web-fetch.js";

describe("Web Fetch PDF support", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.mock("../../media/pdf-extract.js", () => ({
      extractPdfContent: vi.fn().mockResolvedValue({ text: "Extracted PDF text", images: [] }),
    }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("extracts text from PDF responses", async () => {
    const mockPdfBuffer = Buffer.from("%PDF-1.4\n...");

    const mockResponse = {
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => (name.toLowerCase() === "content-type" ? "application/pdf" : null),
      },
      arrayBuffer: async () => mockPdfBuffer.buffer,
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const tool = createWebFetchTool({
      config: {
        tools: {
          web: {
            fetch: {
              cacheTtlMinutes: 0,
              firecrawl: { enabled: false },
            },
          },
        },
      } as unknown as Record<string, unknown>,
    });

    const result = await tool!.execute("call_1", { url: "https://example.com/test.pdf" });
    const payload = (result as unknown as { details: Record<string, unknown> }).details;

    expect(payload.extractor).toBe("pdf-extract");
    expect(payload.text).toContain("Extracted PDF text");
    expect(payload.contentType).toBe("application/pdf");
  });
});
