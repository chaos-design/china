import { ArrowRight, Home, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <section className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center overflow-hidden px-6 py-20">
      <div className="relative flex max-w-2xl flex-col gap-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-vermillion/10 text-vermillion">
            <SearchX className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="font-mono-tech text-muted-foreground text-xs tracking-[0.32em] uppercase">
            404 / path not found
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <h1 className="font-brush text-6xl leading-none text-ink sm:text-8xl">此页未载入史册</h1>
          <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
            你访问的路径暂未收录。可以回到首页重新选择专题，或直接进入时间长河继续浏览中国古代史脉络。
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            asChild
            className="btn-ink rounded-sm bg-vermillion px-6 font-mono-tech text-sm font-semibold tracking-wide text-primary-foreground uppercase hover:bg-vermillion"
          >
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              返回首页
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="rounded-sm font-mono-tech text-sm font-semibold tracking-wide text-ink uppercase underline-offset-4 hover:bg-transparent hover:underline"
          >
            <Link to="/china/timeline">
              前往时间长河
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
