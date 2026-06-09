type IdentityUserResponse = {
  id: string;
  name?: string;
  email?: string;
};

export type UserSummary = {
  id: string;
  name: string;
};

export class IdentityClientService {
  private readonly baseUrl = process.env.IDENTITY_API_URL?.trim() || 'http://localhost:8081';

  async findUserById(userId: string): Promise<UserSummary | null> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/users/${userId}`);

      if (!response.ok) {
        return null;
      }

      const user = await response.json() as IdentityUserResponse;

      return {
        id: user.id,
        name: user.name ?? user.email ?? userId,
      };
    } catch {
      return null;
    }
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 2000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
