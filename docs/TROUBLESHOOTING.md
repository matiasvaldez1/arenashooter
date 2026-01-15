# Troubleshooting Guide

## Connection Issues

### "Failed to connect to server" / "Connection timeout"

1. **Verify server is running**
   ```bash
   npm run server
   ```
   You should see: `Server running on http://localhost:3001`

2. **Check if port 3001 is in use**
   ```bash
   # Windows
   netstat -ano | findstr :3001

   # If in use, kill the process
   taskkill /PID <pid> /F
   ```

3. **Restart everything**
   ```bash
   # Kill all node processes and restart
   npm run dev
   ```

### "Room not found"

- Room codes expire when all players leave
- Verify the code is entered correctly (case-insensitive)
- Room may have started a game already

### Disconnected mid-game

- Check your network connection
- The server may have crashed - check server console for errors
- Try rejoining with the same room code

## Gameplay Issues

### Character not moving

1. Click on the game window to ensure it has focus
2. Check if spawn protection is active (green ring around player)
3. Verify you're using WASD keys (not arrow keys for movement)

### Can't shoot

1. Left click to shoot (not right click)
2. Check if your character is alive (not in respawn countdown)
3. Some abilities may temporarily prevent shooting

### No sound

1. Click the music button (top-right corner) to enable audio
2. Browser may block autoplay - interact with the page first
3. Check system volume and browser tab mute status

### High latency / Lag

- Check your network connection
- Server may be under heavy load
- Try a wired connection instead of WiFi
- Close other bandwidth-heavy applications

### Mobs not appearing

- Only certain maps have mobs (e.g., El Congreso)
- Mobs respawn after being killed (10 second delay)
- Check server console for mob spawn logs

## Development Issues

### Build errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### "Port already in use" error

```bash
# Windows - find process using port
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <pid> /F
```

### Changes not reflecting

1. Vite has hot module replacement - changes should auto-reload
2. For server changes, you need to restart the server
3. Try hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Socket.io connection issues in dev

- Vite proxies socket connections through the dev server
- Check `vite.config.js` for proxy configuration
- Ensure server is running on correct port (3001)

## Browser Compatibility

### Recommended browsers
- Chrome (latest)
- Firefox (latest)
- Edge (latest)

### Known issues
- Safari may have WebSocket connection issues
- Older browsers may not support ES modules
- Mobile browsers are not fully supported

## Getting Help

If you encounter issues not covered here:

1. Check the server console for error messages
2. Check the browser console (F12 -> Console)
3. Open an issue with:
   - Steps to reproduce
   - Error messages
   - Browser and OS version
