export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[200] overflow-hidden bg-slate-100">
      {children}
    </div>
  );
}
