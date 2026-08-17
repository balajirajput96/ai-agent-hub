import { ENV } from "../_core/env";

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Hugging Face Inference API client
 */
export async function runHuggingFaceInference(model: string, prompt: string): Promise<ToolResult> {
  const token = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || "";
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Hugging Face API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reach Hugging Face API" };
  }
}

/**
 * GitHub API client methods
 */
export async function searchGitHubRepos(query: string): Promise<ToolResult> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  try {
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        ...(token ? { Authorization: `token ${token}` } : {}),
        "User-Agent": "AI-Agent-Hub",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `GitHub API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { success: true, data: data.items || [] };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reach GitHub API" };
  }
}

export async function listUserRepos(username: string): Promise<ToolResult> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=10`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        ...(token ? { Authorization: `token ${token}` } : {}),
        "User-Agent": "AI-Agent-Hub",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `GitHub API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to list user repos" };
  }
}

export async function getGitHubFileContents(owner: string, repo: string, path: string): Promise<ToolResult> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        ...(token ? { Authorization: `token ${token}` } : {}),
        "User-Agent": "AI-Agent-Hub",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `GitHub API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    if (data.content && data.encoding === "base64") {
      data.decodedContent = Buffer.from(data.content, "base64").toString("utf-8");
    }
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get GitHub file contents" };
  }
}

export async function searchGitHubCode(query: string): Promise<ToolResult> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  try {
    const res = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(query)}`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        ...(token ? { Authorization: `token ${token}` } : {}),
        "User-Agent": "AI-Agent-Hub",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `GitHub API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { success: true, data: data.items || [] };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to search GitHub code" };
  }
}

export async function createGitHubIssue(owner: string, repo: string, title: string, body: string): Promise<ToolResult> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `token ${token}` } : {}),
        "User-Agent": "AI-Agent-Hub",
      },
      body: JSON.stringify({ title, body }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `GitHub API error (${res.status}): ${errText}` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create GitHub issue" };
  }
}

/**
 * Check health status of integrations
 */
export async function checkIntegrationsHealth() {
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || "";
  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

  let hfStatus = "connected";
  let ghStatus = "connected";

  try {
    const testRes = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: hfToken ? { Authorization: `Bearer ${hfToken}` } : {},
    });
    if (!testRes.ok && hfToken) {
      hfStatus = "degraded";
    }
  } catch {
    hfStatus = hfToken ? "connected" : "guest_mode";
  }

  try {
    const testRes = await fetch("https://api.github.com/rate_limit", {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        ...(ghToken ? { Authorization: `token ${ghToken}` } : {}),
        "User-Agent": "AI-Agent-Hub",
      },
    });
    if (!testRes.ok) {
      ghStatus = "degraded";
    }
  } catch {
    ghStatus = ghToken ? "connected" : "guest_mode";
  }

  return {
    huggingface: { status: hfStatus, tokenConfigured: !!hfToken },
    github: { status: ghStatus, tokenConfigured: !!ghToken },
  };
}
