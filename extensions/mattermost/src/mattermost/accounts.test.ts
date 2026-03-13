import type { OpenClawConfig } from "openclaw/plugin-sdk/mattermost";
import { describe, expect, it } from "vitest";
import { resolveDefaultMattermostAccountId, resolveMattermostAccount } from "./accounts.js";

describe("resolveDefaultMattermostAccountId", () => {
  it("prefers channels.mattermost.defaultAccount when it matches a configured account", () => {
    const cfg: OpenClawConfig = {
      channels: {
        mattermost: {
          defaultAccount: "alerts",
          accounts: {
            default: { botToken: "tok-default", baseUrl: "https://chat.example.com" },
            alerts: { botToken: "tok-alerts", baseUrl: "https://alerts.example.com" },
          },
        },
      },
    };

    expect(resolveDefaultMattermostAccountId(cfg)).toBe("alerts");
  });

  it("normalizes channels.mattermost.defaultAccount before lookup", () => {
    const cfg: OpenClawConfig = {
      channels: {
        mattermost: {
          defaultAccount: "Ops Team",
          accounts: {
            "ops-team": { botToken: "tok-ops", baseUrl: "https://chat.example.com" },
          },
        },
      },
    };

    expect(resolveDefaultMattermostAccountId(cfg)).toBe("ops-team");
  });

  it("falls back when channels.mattermost.defaultAccount is missing", () => {
    const cfg: OpenClawConfig = {
      channels: {
        mattermost: {
          defaultAccount: "missing",
          accounts: {
            default: { botToken: "tok-default", baseUrl: "https://chat.example.com" },
            alerts: { botToken: "tok-alerts", baseUrl: "https://alerts.example.com" },
          },
        },
      },
    };

    expect(resolveDefaultMattermostAccountId(cfg)).toBe("default");
  });
});

describe("resolveMattermostAccount", () => {
  it("resolves defaultTo from account-level config", () => {
    const cfg: OpenClawConfig = {
      channels: {
        mattermost: {
          defaultTo: "@fallback",
          accounts: {
            alerts: {
              botToken: "tok-alerts",
              baseUrl: "https://alerts.example.com",
              defaultTo: "@alerts-channel",
            },
          },
        },
      },
    };

    const account = resolveMattermostAccount({ cfg, accountId: "alerts" });
    expect(account.defaultTo).toBe("@alerts-channel");
  });

  it("resolves defaultTo from top-level config when account-level is missing", () => {
    const cfg: OpenClawConfig = {
      channels: {
        mattermost: {
          defaultTo: "@fallback",
          accounts: {
            alerts: {
              botToken: "tok-alerts",
              baseUrl: "https://alerts.example.com",
            },
          },
        },
      },
    };

    const account = resolveMattermostAccount({ cfg, accountId: "alerts" });
    expect(account.defaultTo).toBe("@fallback");
  });

  it("returns undefined when defaultTo is missing everywhere", () => {
    const cfg: OpenClawConfig = {
      channels: {
        mattermost: {
          accounts: {
            alerts: {
              botToken: "tok-alerts",
              baseUrl: "https://alerts.example.com",
            },
          },
        },
      },
    };

    const account = resolveMattermostAccount({ cfg, accountId: "alerts" });
    expect(account.defaultTo).toBeUndefined();
  });
});
