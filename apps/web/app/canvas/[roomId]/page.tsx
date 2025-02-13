import { RoomCanvas } from "../../../components/RoomCanvas";

export default async function Page({ params }: { params: { roomId: string } }) {
  // You no longer need to await params here because Next.js passes params as an object.
  return <RoomCanvas RoomId={params.roomId} />;
}
