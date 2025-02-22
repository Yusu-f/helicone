import { Env } from "../..";
import { AuthParams } from "../dbLogger/DBLoggable";
import { Result, err, ok } from "../util/results";

export class RateLimiter {
  constructor(
    private rateLimiter: Env["RATE_LIMITER"],
    private authParams: AuthParams
  ) {}

  private getRateLimitParams(tier: string) {
    const rateLimitParams: Record<
      string,
      {
        windowSizeSeconds: number;
        maxCount: number;
      }
    > = {
      free: {
        windowSizeSeconds: 60,
        maxCount: 1_200,
      },
      pro: {
        windowSizeSeconds: 60,
        maxCount: 6_000,
      },
      growth: {
        windowSizeSeconds: 60,
        maxCount: 6_000,
      },
      team: {
        windowSizeSeconds: 60,
        maxCount: 15_000,
      },
      enterprise: {
        windowSizeSeconds: 60,
        maxCount: 30_000,
      },
    };

    if (tier?.toLowerCase().includes("pro")) {
      tier = "pro";
    }
    tier = tier?.toLowerCase() in rateLimitParams ? tier.toLowerCase() : "free";

    return rateLimitParams[tier];
  }

  async checkRateLimit(tier: string): Promise<
    Result<
      {
        isRateLimited: boolean;
        shouldLogInDB: boolean;
        rlIncrementDB: number;
      },
      string
    >
  > {
    try {
      const rateLimiterId = this.rateLimiter.idFromName(
        this.authParams.organizationId
      );

      const rateLimiter = this.rateLimiter.get(rateLimiterId);

      const params = this.getRateLimitParams(tier);

      const rateLimitRes = await rateLimiter.fetch(
        "https://www.this_does_matter.helicone.ai",
        {
          method: "POST",
          body: JSON.stringify(params),
          headers: {
            "content-type": "application/json",
          },
        }
      );

      return ok(
        (await rateLimitRes.json()) as {
          isRateLimited: boolean;
          shouldLogInDB: boolean;
          rlIncrementDB: number;
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return err(JSON.stringify(error));
    }
  }
}
