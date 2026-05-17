import testRoom from './testRoom.js';
import bedroom from './bedroom.js';
import corridor from './corridor.js';
import kitchen from './kitchen.js';
import bathroom from './bathroom.js';
import basement from './basement.js';

const ROOM_LIST = [testRoom, bedroom, corridor, kitchen, bathroom, basement];

export function createRoomManager() {
  const map = new Map(ROOM_LIST.map((room) => [room.id, room]));

  const getRoom = (id) => map.get(id) ?? ROOM_LIST[0];

  const getVisibleRooms = (roomId) => {
    const room = getRoom(roomId);
    const linked = room.portals.map((portal) => getRoom(portal.to));
    return [room, ...linked.filter(Boolean)];
  };

  return {
    getRoom,
    getVisibleRooms,
    getStartRoom() {
      return testRoom;
    },
    getMap() {
      return ROOM_LIST;
    },
  };
}
