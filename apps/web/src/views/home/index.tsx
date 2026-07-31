import Image from "next/image";
import { t } from "@lingui/core/macro";
import { useTheme } from "next-themes";

import { PageHead } from "~/components/PageHead";
import Agents from "./components/Agents";
import Cta from "./components/Cta";
import Divider from "./components/Divider";
import FAQs from "./components/Faqs";
import Features from "./components/Features";
import HeroBoard from "./components/HeroBoard";
import Layout from "./components/Layout";
import Logos from "./components/Logos";
import Testimonials from "./components/Testimonials";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Kan",
  url: "https://kan.bn",
  description:
    "Kanban for teams and agents. A simpler, faster alternative to Trello with a built-in MCP server.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  license: "https://www.gnu.org/licenses/agpl-3.0.html",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
    {
      "@type": "Offer",
      name: "Teams",
      price: "8",
      priceCurrency: "USD",
      description: "Per user per month, billed yearly",
    },
  ],
  publisher: {
    "@type": "Organization",
    name: "Kan",
    url: "https://kan.bn",
    sameAs: ["https://github.com/kanbn/kan"],
  },
};

export default function HomeView() {
  const { resolvedTheme } = useTheme();

  return (
    <Layout>
      <PageHead
        title="Opscape | The open source alternative to Trello"
        description="A powerful, flexible kanban app that helps you organise work, track progress, and deliver results—all in one place. Free, open source, and self-hostable."
      />
      <div className="flex h-full w-full flex-col lg:pt-20">
        <div className="w-full pt-32 pb-10 lg:py-32">
          <div className="my-10 flex h-full w-full animate-fade-down flex-col items-center justify-center px-4">
            <p className="mt-2 text-center text-4xl font-bold text-light-1000 dark:text-dark-1000 lg:text-5xl">
              Opscape <br /> <span className="text-3xl lg:text-4xl">Kan</span>
            </p>

            <p className="text-md mt-3 max-w-[450px] text-center text-light-950 lg:max-w-[600px] lg:text-lg dark:text-dark-900">
              {t`A powerful, flexible kanban app that helps you organise work, track progress, and deliver results—all in one place.`}
            </p>
          </div>
        </div>

        <section className="px-4 pb-10">
          <div className="rounded-[16px] border border-light-300 bg-light-50 p-1 lg:rounded-[20px] lg:p-1.5 dark:border-white/10 dark:bg-dark-100">
            <div className="relative overflow-hidden rounded-[12px] border border-light-300 lg:rounded-[14px] dark:border-white/10">
              <HeroBoard />
            </div>
          </div>
        </section>

        <Divider />
        <Logos />
        <Divider />
        <div className="relative pt-16">
          <div id="features" className="absolute -top-20" />
          <Features theme={resolvedTheme === "dark" ? "dark" : "light"} />
        </div>
        <Divider />
        <div className="relative pt-16">
          <div id="agents" className="absolute -top-20" />
          <Agents />
        </div>
        <Divider />
        <div className="relative pt-16">
          <div id="testimonials" className="absolute -top-20" />
          <Testimonials />
        </div>
        <Divider />
        <div className="relative pt-16">
          <div id="faq" className="absolute -top-20" />
          <FAQs />
        </div>
        <Divider />
        <div className="relative">
          <Cta />
        </div>
      </div>
    </Layout>
  );
}
