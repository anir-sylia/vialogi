import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 font-sans text-slate-900">
        <h1 className="text-2xl font-semibold">404</h1>
        <p className="text-slate-600">This page could not be found.</p>
        <Link href="/fr" className="text-teal-600 underline">
          Go to home
        </Link>
      </body>
    </html>
  );
}
