import Image from "next/image";
import { t } from "@lingui/core/macro";
import { useTheme } from "next-themes";

import { PageHead } from "~/components/PageHead";
import Cta from "./components/Cta";
import FAQs from "./components/Faqs";
import Features from "./components/Features";
import Layout from "./components/Layout";
import Logos from "./components/Logos";
import Testimonials from "./components/Testimonials";

export default function HomeView() {
  const { resolvedTheme } = useTheme();

  return (
    <Layout>
      <PageHead title="Opscape | The open source alternative to Trello" />
      <div className="flex h-full w-full flex-col lg:pt-[5rem]">
        <div className="w-full pb-10 pt-32 lg:py-32">
          <div className="my-10 flex h-full w-full animate-fade-down flex-col items-center justify-center px-4">
            <p className="mt-2 text-center text-4xl font-bold text-light-1000 dark:text-dark-1000 lg:text-5xl">
              Opscape Kan
            </p>

            <p className="text-md mt-3 max-w-[450px] text-center text-light-950 dark:text-dark-900 lg:max-w-[600px] lg:text-lg">
              {t`A powerful, flexible kanban app that helps you organise work, track progress, and deliver results—all in one place.`}
            </p>
          </div>
        </div>
        <div className="px-4 pb-10">
          <div className="rounded-[16px] border border-light-300 bg-light-50 p-1 shadow-md dark:border-dark-300 dark:bg-dark-100 lg:rounded-[24px] lg:p-2">
            <div className="relative overflow-hidden rounded-[12px] border border-light-300 shadow-sm dark:border-dark-300 lg:rounded-[16px]">
              <Image
                src={`/hero-light.png`}
                alt="kanban"
                width={1100}
                height={1000}
                className="block dark:hidden"
              />
              <Image
                src={`/hero-dark.png`}
                alt="kanban"
                width={1100}
                height={1000}
                className="hidden dark:block"
              />
            </div>
          </div>
        </div>
        <Logos />
        <div className="relative pt-10">
          <div id="features" className="absolute -top-20" />
          <Features theme={resolvedTheme === "dark" ? "dark" : "light"} />
        </div>
        <div className="relative pt-10">
          <div id="testimonials" className="absolute -top-20" />
          <Testimonials />
        </div>
        <div className="relative pt-10">
          <div id="faq" className="absolute -top-20" />
          <FAQs />
        </div>
        <div className="relative">
          <Cta theme={resolvedTheme ?? "light"} />
        </div>
      </div>
    </Layout>
  );
}
