export function HouseSilhouette({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M72 214c0-62 58-112 168-112s168 50 168 112v86H72v-86Z"
        className="fill-current opacity-15"
      />
      <path
        d="M86 208 240 86l154 122"
        className="stroke-current"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M118 188v126h244V188"
        className="stroke-current"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="206"
        y="232"
        width="68"
        height="82"
        rx="8"
        className="stroke-current"
        strokeWidth="10"
      />
      <rect
        x="146"
        y="214"
        width="36"
        height="36"
        rx="6"
        className="fill-current opacity-35"
      />
      <rect
        x="298"
        y="214"
        width="36"
        height="36"
        rx="6"
        className="fill-current opacity-35"
      />
      <path
        d="M312 86h42v48"
        className="stroke-current"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MapSilhouette({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M86 92h308v176H86z"
        className="fill-current opacity-10"
        rx="24"
      />
      <rect
        x="86"
        y="92"
        width="308"
        height="176"
        rx="24"
        className="stroke-current"
        strokeWidth="10"
      />
      <path
        d="M132 168c42-48 92-48 134 0s92 48 134 0"
        className="stroke-current opacity-50"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M148 220c56-20 128-20 184 0"
        className="stroke-current opacity-50"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M240 118c-28 0-50 22-50 50 0 38 50 86 50 86s50-48 50-86c0-28-22-50-50-50Z"
        className="fill-current opacity-25 stroke-current"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <circle cx="240" cy="168" r="16" className="fill-background stroke-current" strokeWidth="8" />
    </svg>
  );
}
