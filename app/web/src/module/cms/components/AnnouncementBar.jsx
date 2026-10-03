import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { announcementBarStyle } from "@/module/cms/lib/announcement-style";
import { useAnnouncementCms } from "@/module/cms/hooks/use-home-cms";

function dismissKey(ids) {
  return `decory-cms-announcement-${ids.join("-")}`;
}

function MarqueeTrack({ announcements }) {
  const segment = announcements.map((item, index) => (
    <Fragment key={`${item.id}-${index}`}>
      {index > 0 ? <span className="px-3 opacity-70">•</span> : null}
      {item.href ? (
        <Link to={item.href} className="whitespace-nowrap hover:underline">
          {item.message}
        </Link>
      ) : (
        <span className="whitespace-nowrap">{item.message}</span>
      )}
    </Fragment>
  ));

  return (
    <div className="announcement-marquee flex min-w-full shrink-0 items-center">
      <div className="announcement-marquee-track flex items-center pr-12">{segment}</div>
      <div className="announcement-marquee-track flex items-center pr-12" aria-hidden="true">
        {segment}
      </div>
    </div>
  );
}

export function AnnouncementBar() {
  const announcements = useAnnouncementCms();
  const [hidden, setHidden] = useState(false);
  const ids = useMemo(() => announcements.map((row) => row.id), [announcements]);
  const dismissible = announcements.some((row) => row.dismissible);

  useEffect(() => {
    if (!ids.length) {
      setHidden(false);
      return;
    }
    setHidden(sessionStorage.getItem(dismissKey(ids)) === "1");
  }, [ids]);

  if (!announcements.length || hidden) return null;

  const barStyle = announcementBarStyle(announcements);

  function dismiss() {
    if (!dismissible) return;
    sessionStorage.setItem(dismissKey(ids), "1");
    setHidden(true);
  }

  return (
    <div
      className={cn("relative z-[60] w-full overflow-hidden py-2.5", barStyle.className)}
      style={barStyle.style}
    >
      <div className="mx-auto flex max-w-[1240px] items-center md:px-8">
        <div className="min-w-0 flex-1 overflow-hidden">
          <MarqueeTrack announcements={announcements} />
        </div>
        {dismissible ? (
          <button
            type="button"
            aria-label="Dismiss announcement"
            className="ml-3 shrink-0 rounded-full p-1 opacity-80 hover:opacity-100"
            onClick={dismiss}
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
