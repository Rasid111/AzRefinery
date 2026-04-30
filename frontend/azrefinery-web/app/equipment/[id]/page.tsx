import Link from "next/link";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-3">
      <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
        ← К дашборду
      </Link>
      <h1 className="text-2xl font-semibold">{id}</h1>
      <p className="text-sm text-slate-400">
        Детальная страница объекта — этап 7.
      </p>
    </div>
  );
}
