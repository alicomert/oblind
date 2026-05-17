import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRoomManager } from '../src/rooms/RoomManager.js';

test('room manager starts in a visible rectangular test room', () => {
  const manager = createRoomManager();
  const startRoom = manager.getStartRoom();
  const floor = startRoom.layout.find((block) => block.role === 'floor');
  const ceiling = startRoom.layout.find((block) => block.role === 'ceiling');
  const redSurfaces = startRoom.layout.filter((block) => block.role === 'wall');
  const cornerMarkers = startRoom.layout.filter((block) => block.role === 'corner-marker');

  assert.equal(startRoom.id, 'test-room');
  assert.equal(startRoom.name, 'Test Odası');
  assert.equal(startRoom.playerStart.y, 1.7);
  assert.equal(startRoom.portals.length, 0);
  assert.ok(startRoom.layout.length >= 6);
  assert.ok(startRoom.layout.every((block) => block.size.some((axis) => axis <= 0.35)));
  assert.equal(floor.color, 0x00ff00);
  assert.equal(floor.material, 'debug-basic');
  assert.equal(ceiling.color, 0x00ff00);
  assert.equal(ceiling.material, 'debug-basic');
  assert.equal(redSurfaces.length, 4);
  assert.ok(redSurfaces.every((block) => block.color === 0xff0000));
  assert.ok(redSurfaces.every((block) => block.material === 'debug-basic'));
  assert.equal(cornerMarkers.length, 4);
  assert.ok(cornerMarkers.every((block) => block.color === 0xffffff));
  assert.ok(cornerMarkers.every((block) => block.material === 'debug-basic'));
});
