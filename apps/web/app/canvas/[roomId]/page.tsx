// "use client";

import { RoomCanvas } from "../../../components/RoomCanvas";

// interface PageProps {
//   params: {
//     roomId: string;
//   };
// }

// const Page = ({ params }: PageProps) => {
//   return <RoomCanvas RoomId={params.roomId} />;
// };

// export default Page;

// // app/canvas/[roomId]/page.tsx

// This is a server component by default
export default function Page({ params }: { params: { roomId: string } }) {
  // Pass the roomId to a client component for interactivity
  return <RoomCanvas RoomId={params.roomId} />;
}
