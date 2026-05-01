import Link from "next/link";
import { EquipmentDetailClient } from "./EquipmentDetailClient";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
        ← К дашборду
      </Link>
      <EquipmentDetailClient id={id} />
    </div>
  );
}
