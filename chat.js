import { v4 } from "https://deno.land/std@0.58.0/uuid/mod.ts";
import { isWebSocketCloseEvent } from "https://deno.land/std@0.58.0/ws/mod.ts";
/**
 * userId: {
 *    userId: string,
 *    name: string,
 *    groupName: string,
 *    ws: WebSocket
 * }
 */
const usersMap = new Map();

/**
 * groupName: [user1, user2]
 * 
 * {
 *    userId: string,
 *    name: string,
 *    groupName: string,
 *    ws: WebSocket
 * }
 */
const groupsMap = new Map();

export default async function chat(ws) {
  console.log(`connected`);
  const userId = v4.generate();

  for await (let data of ws) {
    console.log('gi day:', data, ' type:', typeof data);

    if (isWebSocketCloseEvent(data)) {
      const userObj = usersMap.get(userId);
      let users = groupsMap.get(userObj.groupName) || []
      users = users.filter(u => u.userId !== userId);

      groupsMap.set(userObj.groupName, users);

      usersMap.delete(userId);
      emitEvent(userObj.groupName);
      break;
    }
    
    const event = typeof data === 'string' ? JSON.parse(data) : data;
    switch (event.event) {
      case 'join':
        const userObj = {
          userId,
          name: event.name,
          groupName: event.groupName,
          ws
        };
        usersMap.set(userId, userObj);
        const users = groupsMap.get(event.groupName) || [];
        users.push(userObj);
        groupsMap.set(event.groupName, users);
        
        emitEvent(event.groupName);
    }
  }
}

function emitEvent(groupName) {
  const users = groupsMap.get(groupName) || [];
  for (const user of users) {
    const event = {
      event: 'users',
      data: getDisplayUsers(groupName)
    }
    user.ws.send(JSON.stringify(event))
  }
}

function getDisplayUsers(groupName) {
  const users = groupsMap.get(groupName) || [];
  return users.map(u => {
    return {userId: u.userId, name: u.name};
  })
}