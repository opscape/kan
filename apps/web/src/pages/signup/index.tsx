import { useRouter } from "next/router";
import { useEffect } from "react";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    void router.replace({ pathname: "/login", query: router.query });
  }, [router]);

  return null;
}
