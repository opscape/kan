import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createAuthMiddleware } from "better-auth/api";
import { env } from "next-runtime-env";

import type { dbClient } from "@kan/db/client";
import * as memberRepo from "@kan/db/repository/member.repo";
import { createSubscriber, triggerSubscriberWorkflow } from "@kan/email";
import { createLogger } from "@kan/logger";
import { createS3Client, getAvatarUrl } from "@kan/shared";

import { downloadImage } from "./utils";

const log = createLogger("auth");

type BetterAuthUserFields = {
  id?: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
  stripeCustomerId?: string | null | undefined;
};

type BetterAuthUser = BetterAuthUserFields & { id: string } & Record<
  string,
  unknown
>;

type PendingBetterAuthUser = BetterAuthUserFields & Record<string, unknown>;

export function createDatabaseHooks(db: dbClient) {
  return {
    user: {
      create: {
        async before(user: PendingBetterAuthUser, _context: unknown) {
          if (env("NEXT_PUBLIC_DISABLE_SIGN_UP")?.toLowerCase() === "true") {
            const pendingInvitation = await memberRepo.getByEmailAndStatus(
              db,
              user.email,
              "invited",
            );

            if (!pendingInvitation) {
              return Promise.resolve(false);
            }

            // Fall through to any additional checks below
          }
          // Enforce allowed domains (OIDC/social) if configured
          const allowed = process.env.BETTER_AUTH_ALLOWED_DOMAINS?.split(",")
            .map((d) => d.trim().toLowerCase())
            .filter(Boolean);
          if (allowed && allowed.length > 0) {
            const domain = user.email.split("@")[1]?.toLowerCase();
            if (!domain || !allowed.includes(domain)) {
              return Promise.resolve(false);
            }
          }

          const storageDomain = process.env.NEXT_PUBLIC_STORAGE_DOMAIN;
          if (
            !user.image ||
            !storageDomain ||
            user.image.includes(storageDomain)
          ) {
            if (user.image?.startsWith("data:")) {
              log.warn(
                { userId: user.id },
                "Discarding provider avatar because object storage is not configured",
              );
              return { data: { ...user, image: null } };
            }

            return Promise.resolve(true);
          }

          try {
            const userId = user.id ?? randomUUID();
            const client = createS3Client();
            const dataImageMatch = user.image.match(
              /^data:image\/(jpeg|png|webp);base64,/i,
            );
            const extensionFromUrl = user.image
              .split(".")
              .pop()
              ?.split("?")[0]
              ?.toLowerCase();
            const extension =
              dataImageMatch?.[1] ??
              (extensionFromUrl === "jpg" ||
              extensionFromUrl === "jpeg" ||
              extensionFromUrl === "png" ||
              extensionFromUrl === "webp"
                ? extensionFromUrl
                : "jpg");
            const normalizedExtension =
              extension === "jpg" ? "jpeg" : extension;
            const key = `${userId}/avatar.${extension}`;
            const imageBuffer = await downloadImage(user.image);

            await client.send(
              new PutObjectCommand({
                Bucket: env("NEXT_PUBLIC_AVATAR_BUCKET_NAME") ?? "",
                Key: key,
                Body: imageBuffer,
                ContentType: `image/${normalizedExtension}`,
              }),
            );

            return { data: { ...user, id: userId, image: key } };
          } catch (error) {
            log.warn(
              { err: error, userId: user.id },
              "Unable to store provider avatar; creating user without an avatar",
            );
            return { data: { ...user, image: null } };
          }
        },
        async after(user: BetterAuthUser, _context: unknown) {
          const avatarKey = user.image;

          const [firstName, ...rest] = (user.name || "")
            .split(" ")
            .filter(Boolean);
          const lastName = rest.length ? rest.join(" ") : undefined;

          try {
            const avatarUrl = getAvatarUrl(avatarKey) ?? undefined;

            await createSubscriber({
              publicId: user.id,
              email: user.email,
              externalId: user.id,
              firstName,
              lastName,
              name: user.name,
              attributes: {
                avatarUrl,
                emailVerified: user.emailVerified,
                stripeCustomerId: user.stripeCustomerId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              },
            });
          } catch (error) {
            log.error({ err: error }, "Error creating subscriber");
          }

          try {
            log.info(
              { workflowId: "user-signup", userId: user.id, email: user.email },
              "Triggering user-signup workflow",
            );
            await triggerSubscriberWorkflow("user-signup", {
              publicId: user.id,
            });
            log.info(
              { workflowId: "user-signup", userId: user.id },
              "user-signup workflow triggered",
            );
          } catch (error) {
            log.error({ err: error }, "Error triggering user-signup workflow");
          }
        },
      },
    },
  };
}

export function createMiddlewareHooks(db: dbClient) {
  return {
    after: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/magic-link/verify" &&
        (ctx.query?.callbackURL as string | undefined)?.includes("type=invite")
      ) {
        const userId = ctx.context.newSession?.session.userId;
        const callbackURL = ctx.query?.callbackURL as string | undefined;
        const memberPublicId = callbackURL?.split("memberPublicId=")[1];

        if (userId && memberPublicId) {
          const member = await memberRepo.getByPublicId(db, memberPublicId);

          if (member?.id) {
            await memberRepo.acceptInvite(db, {
              memberId: member.id,
              userId,
            });
          }
        }
      }
    }),
  };
}
