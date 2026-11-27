import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "../../../lib/utils";

/**
 * 职官制度三个视图共用的返回口。
 *
 * 总目把三个近似入口收敛成一处后，读者点进任一视图就失去了「回到那份菜单」的路径；
 * 这个链接补回这条逆向通道，样式与页头的小签保持一致。
 */
export function OfficialsBackLink({
  className,
  label = "返回职官制度",
  to = "/china/officials",
}: {
  className?: string;
  label?: string;
  to?: string;
}) {
  return (
    <Link
      className={cn(
        "pointer-events-auto inline-flex w-fit items-center gap-1 rounded-full border border-ink/15 bg-paper/80 px-2.5 py-0.5 font-kai text-xs text-muted-foreground transition-colors hover:border-vermillion/45 hover:text-vermillion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      to={to}
    >
      <ArrowLeft aria-hidden="true" className="h-3 w-3" />
      {label}
    </Link>
  );
}
