
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { getUniqueRooms } from '@/data/schedule';

export default function Rooms() {
  const rooms = getUniqueRooms();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Available Rooms</h1>
        <p className="text-muted-foreground">Select a room to view its schedule.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rooms.map((room) => (
          <Link to={`/rooms/${room}`} key={room}>
            <Card className="hover:bg-accent hover:border-primary transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span>Room: {room}</span>
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
