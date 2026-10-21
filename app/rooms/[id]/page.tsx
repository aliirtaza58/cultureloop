import { notFound } from "next/navigation";
import { RoomWorkspace } from "../../ui/room-workspace.tsx";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) notFound();
  return <main id="main" className="wrap room-main"><RoomWorkspace id={id}/></main>;
}
