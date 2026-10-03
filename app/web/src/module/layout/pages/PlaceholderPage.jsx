import { Link } from "react-router-dom";

export function PlaceholderPage({ title, body }) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-12 md:px-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground">{body}</p>
      <Link to="/" className="mt-6 inline-block text-sm font-medium hover:underline">
        Back home
      </Link>
    </div>
  );
}
