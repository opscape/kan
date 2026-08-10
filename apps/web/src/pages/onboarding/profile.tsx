import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@lingui/core/macro";
import { useEffect, useState } from "react";

import { authClient } from "@kan/auth/client";

import Button from "~/components/Button";
import Input from "~/components/Input";
import { PageHead } from "~/components/PageHead";
import PatternedBackground from "~/components/PatternedBackground";
import { usePopup } from "~/providers/popup";
import { api } from "~/utils/api";

const getSafeReturnUrl = (returnUrl: string | null) => {
  if (!returnUrl?.startsWith("/") || returnUrl.startsWith("//")) {
    return "/boards";
  }

  return returnUrl;
};

export default function ProfileOnboardingPage() {
  const router = useRouter();
  const returnUrl = getSafeReturnUrl(useSearchParams().get("returnUrl"));
  const { data: session, isPending } = authClient.useSession();
  const { showPopup } = usePopup();
  const utils = api.useUtils();
  const [name, setName] = useState("");

  const updateUser = api.user.update.useMutation({
    onSuccess: async () => {
      await utils.user.getUser.invalidate();
      router.replace(returnUrl);
    },
    onError: () => {
      showPopup({
        header: t`Error updating display name`,
        message: t`Please try again later, or contact customer support.`,
        icon: "error",
      });
    },
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace(
        `/login?next=${encodeURIComponent(`/onboarding/profile?returnUrl=${encodeURIComponent(returnUrl)}`)}`,
      );
    }
  }, [isPending, returnUrl, router, session?.user]);

  if (isPending || !session?.user) return null;

  const handleContinue = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 3) return;

    updateUser.mutate({ name: trimmedName });
  };

  return (
    <>
      <PageHead title="Login | Opscape" />
      <main className="h-screen bg-light-100 pt-20 dark:bg-dark-50 sm:pt-0">
        <div className="justify-top flex h-full flex-col items-center px-4 sm:justify-center">
          <div className="z-10 flex w-full flex-col items-center">
            <Link href="/">
              <h1 className="mb-6 text-lg font-bold tracking-tight text-light-1000 dark:text-dark-1000">
                Opscape
              </h1>
            </Link>
            <p className="mb-10 text-3xl font-bold tracking-tight text-light-1000 dark:text-dark-1000">
              {t`Get started`}
            </p>
            <div className="w-full rounded-lg border border-light-500 bg-light-300 px-4 py-10 dark:border-dark-400 dark:bg-dark-200 sm:max-w-md lg:px-10">
              <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleContinue();
                  }}
                >
                  <Input
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t`Enter your name`}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={updateUser.isPending}
                    disabled={name.trim().length < 3}
                  >
                    {t`Continue`}
                  </Button>
                </form>
              </div>
            </div>
          </div>
          <PatternedBackground />
        </div>
      </main>
    </>
  );
}
