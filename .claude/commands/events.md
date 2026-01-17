---
description: List all Socket.io events in client and server
---

Search for all Socket.io events in the codebase:
1. Server emits (`io.emit`, `socket.emit`, `io.to().emit`)
2. Server listeners (`socket.on`)
3. Client emits (`socket.emit`, `SocketManager` methods)
4. Client listeners (`socket.on`)

Display as a table with columns: Event Name | Direction | File | Line
Group by domain (room:*, player:*, game:*, wave:*)
