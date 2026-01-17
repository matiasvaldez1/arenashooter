// Internationalization - Argentinian Spanish default
// Use: import { t, setLanguage, getLanguage } from '../utils/i18n.js';

let currentLanguage = 'es-AR';

const translations = {
  'es-AR': {
    // Menu Scene
    'game.title': '8-BIT ARENA',
    'game.subtitle': ':: EDICION FAMOSOS ::',
    'menu.enterName': '[ INGRESA TU NOMBRE ]',
    'menu.createRoom': 'CREAR SALA',
    'menu.or': '═══════ O ═══════',
    'menu.enterRoomCode': '[ CODIGO DE SALA ]',
    'menu.joinRoom': 'UNIRSE A SALA',
    'menu.music': 'MUSICA',
    'menu.volume': 'VOLUMEN',
    'menu.enterRoomCodeError': 'Ingresa un codigo de sala!',

    // Lobby Scene
    'lobby.title': 'SALA:',
    'lobby.roomCode': 'CODIGO DE SALA',
    'lobby.players': 'JUGADORES',
    'lobby.player': 'jugador',
    'lobby.playersPlural': 'jugadores',
    'lobby.waiting': 'Esperando jugadores...',
    'lobby.waitingHost': 'Esperando al anfitrion...',
    'lobby.selectMode': 'ELEGIR MODO DE JUEGO',
    'lobby.selectMap': 'ELEGIR MAPA',
    'lobby.selectCharacter': 'ELEGIR TU PERSONAJE',
    'lobby.readyUp': 'PREPARATE!',
    'lobby.ready': 'LISTO',
    'lobby.notReady': 'NO LISTO',
    'lobby.cancel': 'CANCELAR',
    'lobby.startGame': 'INICIAR PARTIDA',
    'lobby.copyLink': 'COPIAR LINK',
    'lobby.copied': 'COPIADO!',
    'lobby.leave': 'SALIR',
    'lobby.you': '(VOS)',
    'lobby.host': '(ANFITRION)',
    'lobby.next': 'SIGUIENTE →',
    'lobby.back': '← ATRAS',
    'lobby.selected': '★ SELECCIONADO',
    'lobby.coop': '1-4 Jugadores (Coop)',
    'lobby.ffa': '1-8 Jugadores (Todos)',
    'lobby.mode': 'MODO:',
    'lobby.map': 'MAPA:',
    'lobby.character': 'PERSONAJE:',
    'lobby.playersReady': 'jugadores listos',
    'lobby.checkReady': '✓ LISTO',
    'lobby.statusWaiting': 'ESPERANDO',
    'lobby.enemies': 'Enemigos:',
    'lobby.noEnemies': 'Sin enemigos',

    // Game Scene
    'game.health': 'VIDA',
    'game.score': 'PUNTAJE',
    'game.kills': 'BAJAS',
    'game.deaths': 'MUERTES',
    'game.respawning': 'Reviviendo en',
    'game.ultimate': 'ULTIMATE',
    'game.dodge': 'ESQUIVE',
    'game.ready': 'LISTO',
    'game.cooldown': 'ENFRIANDO',
    'game.killedBy': 'te elimino',
    'game.youKilled': 'Eliminaste a',
    'game.gameOver': 'FIN DEL JUEGO',
    'game.finalKill': 'BAJA FINAL',
    'game.winner': 'GANADOR',
    'game.returnToLobby': 'Volviendo al lobby...',
    'game.press': 'PRESIONA',
    'game.toRespawn': 'PARA REVIVIR',

    // Kill streaks
    'streak.double': 'DOBLE BAJA!',
    'streak.triple': 'TRIPLE BAJA!',
    'streak.quad': 'CUADRUPLE!',
    'streak.unstoppable': 'IMPARABLE!',
    'streak.godlike': 'MODO DIOS!',
    'streak.legendary': 'LEGENDARIO!',

    // Characters - Politics
    'char.messi.name': 'Messi',
    'char.messi.desc': 'El GOAT - Gambetas rapidas, tiros mortales!',
    'char.milei.name': 'Milei',
    'char.milei.desc': 'VIVA LA LIBERTAD! Economista con motosierra!',
    'char.trump.name': 'Trump',
    'char.trump.desc': 'Construye muros, despliega torretas, Make Arena Great Again!',
    'char.biden.name': 'Biden',
    'char.biden.desc': 'Cura aliados con helado, roba vida!',
    'char.putin.name': 'Putin',
    'char.putin.desc': 'Lanza misiles, despliega osos!',

    // Characters - K-pop
    'char.jungkook.name': 'Jungkook',
    'char.jungkook.desc': 'Golden Maknae - Todoterreno con movimientos explosivos!',
    'char.momo.name': 'Momo',
    'char.momo.desc': 'Reina del Baile - Velocidad y gracia!',
    'char.haewon.name': 'Haewon',
    'char.haewon.desc': 'Poder Vocal - Ondas sonicas devastadoras!',
    'char.lisa.name': 'Lisa',
    'char.lisa.desc': 'Rapera Letal - Fuego rapido y estilo!',
    'char.winter.name': 'Winter',
    'char.winter.desc': 'Reina del Hielo - Congela a tus enemigos!',

    // Ultimates
    'ult.goldenBall': 'Pelota de Oro',
    'ult.goldenBallDesc': 'Sere imparable, pelotas de futbol a lo loco!',
    'ult.dollarization': 'Dolarizacion',
    'ult.dollarizationDesc': 'AFUERA! Doble dano, explosion de guita!',
    'ult.magaMech': 'Mecha MAGA',
    'ult.magaMechDesc': 'Transformate en un mecha gigante!',
    'ult.executiveOrder': 'Decreto Presidencial',
    'ult.executiveOrderDesc': 'Intercambia vida con el enemigo mas debil!',
    'ult.nuclearStrike': 'Ataque Nuclear',
    'ult.nuclearStrikeDesc': 'Lluvia de misiles en toda la arena!',

    // Ultimates - K-pop
    'ult.dynamite': 'Dynamite',
    'ult.dynamiteDesc': 'Fuegos artificiales explosivos caen del cielo!',
    'ult.fancy': 'Fancy',
    'ult.fancyDesc': 'Hipnotiza enemigos, reduciendolos drasticamente!',
    'ult.oo': 'O.O',
    'ult.ooDesc': 'Ondas sonicas danan a todos los enemigos en pantalla!',
    'ult.money': 'Money',
    'ult.moneyDesc': 'Aura de dano y velocidad de ataque aumentada!',
    'ult.blackMamba': 'Black Mamba',
    'ult.blackMambaDesc': 'Tormenta de hielo congela y dana a todos los enemigos!',

    // Powerups
    'powerup.speed': 'Energizante',
    'powerup.damage': 'Furia',
    'powerup.shield': 'Guardaespaldas',
    'powerup.rapidFire': 'Adrenalina',
    'powerup.health': 'Botiquin',
    'powerup.ricochet': 'Rebote',

    // Stats labels
    'stats.health': 'VIDA',
    'stats.speed': 'VELOC',
    'stats.damage': 'DAÑO',
    'stats.fireRate': 'CADENCIA',
    'stats.hp': 'HP',
    'stats.spd': 'VEL',
    'stats.ultimate': 'ULTIMATE',

    // Lobby extras
    'lobby.roomCode': 'CODIGO DE SALA',
    'lobby.copyLink': 'COPIAR LINK',
    'lobby.selectMode': 'ELEGIR MODO DE JUEGO',
    'lobby.selectMap': 'ELEGIR MAPA',
    'lobby.selectChar': 'ELEGIR PERSONAJE',
    'lobby.readyUp': 'PREPARATE!',
    'lobby.mode': 'MODO:',
    'lobby.map': 'MAPA:',
    'lobby.character': 'PERSONAJE:',
    'lobby.playersReady': 'jugadores listos',
    'lobby.waiting': 'ESPERANDO',
    'lobby.next': 'SIGUIENTE →',
    'lobby.back': '← ATRAS',
    'lobby.cancel': 'CANCELAR',
    'lobby.selected': '★ SELECCIONADO',
    'lobby.coop': '1-4 Jugadores (Coop)',
    'lobby.ffa': '1-8 Jugadores (Todos vs Todos)',

    // Game extras
    'game.wave': 'OLEADA',
    'game.mobs': 'Enemigos:',
    'game.waveComplete': 'OLEADA COMPLETA!',
    'game.choosePerk': 'ELIGE UNA MEJORA',
    'game.time': 'Tiempo:',
    'game.modifiers': 'MODIFICADORES',
    'game.perks': 'MEJORAS',
    'game.finalWave': 'Oleada Final:',
    'game.totalKills': 'Bajas Totales:',
    'game.perksCollected': 'Mejoras Obtenidas:',
    'game.timeSurvived': 'Tiempo Sobrevivido:',
    'game.returnLobby': 'VOLVER AL LOBBY',
    'game.playAgain': 'JUGAR DE NUEVO',
    'game.paused': 'PAUSA',
    'game.resume': 'CONTINUAR',
    'game.finalScores': 'PUNTAJES FINALES',
    'game.victory': 'VICTORIA!',
    'game.ultimateReady': '[Q] ULTIMATE: LISTO!',
    'game.ultimateCharge': '[Q] ULTIMATE:',
    'game.streak': 'x RACHA',
    'game.controls': 'WASD: Mover | Click: Disparar | ESPACIO: Esquivar | SHIFT: Habilidad | Q: Ultimate',

    // Boot
    'boot.loading': 'Cargando...',
    'boot.connectionFailed': 'Error al conectar con el servidor!',

    // Misc
    'misc.connecting': 'Conectando...',
    'misc.disconnected': 'Desconectado',
    'misc.reconnecting': 'Reconectando...',
    'misc.error': 'Error',
    'misc.roomNotFound': 'Sala no encontrada',
    'misc.roomFull': 'Sala llena',
    'misc.language': 'Idioma',

    // Infinite Horde Mode
    'horde.title': 'Horda Infinita',
    'horde.description': 'Oleadas sin fin con jefes cada 3 oleadas',
    'horde.bossWave': 'OLEADA DE JEFE',
    'horde.bossDefeated': 'JEFE DERROTADO!',
    'horde.bossesKilled': 'Jefes Eliminados:',
    'boss.megaBear': 'Mega Oso',
    'boss.tank': 'Tanque',
    'boss.helicopter': 'Helicoptero',
  },

  'en': {
    // Menu Scene
    'game.title': '8-BIT ARENA',
    'game.subtitle': ':: FAMOUS PERSONALITIES EDITION ::',
    'menu.enterName': '[ ENTER YOUR NAME ]',
    'menu.createRoom': 'CREATE ROOM',
    'menu.or': '═══════ OR ═══════',
    'menu.enterRoomCode': '[ ENTER ROOM CODE ]',
    'menu.joinRoom': 'JOIN ROOM',
    'menu.music': 'MUSIC',
    'menu.volume': 'VOLUME',
    'menu.enterRoomCodeError': 'Please enter a room code!',

    // Lobby Scene
    'lobby.title': 'ROOM:',
    'lobby.roomCode': 'ROOM CODE',
    'lobby.players': 'PLAYERS',
    'lobby.player': 'player',
    'lobby.playersPlural': 'players',
    'lobby.waiting': 'Waiting for players...',
    'lobby.waitingHost': 'Waiting for host...',
    'lobby.selectMode': 'SELECT GAME MODE',
    'lobby.selectMap': 'SELECT MAP',
    'lobby.selectCharacter': 'SELECT YOUR CHARACTER',
    'lobby.readyUp': 'READY UP!',
    'lobby.ready': 'READY',
    'lobby.notReady': 'NOT READY',
    'lobby.cancel': 'CANCEL',
    'lobby.startGame': 'START GAME',
    'lobby.copyLink': 'COPY LINK',
    'lobby.copied': 'COPIED!',
    'lobby.leave': 'LEAVE',
    'lobby.you': '(YOU)',
    'lobby.host': '(HOST)',
    'lobby.next': 'NEXT →',
    'lobby.back': '← BACK',
    'lobby.selected': '★ SELECTED',
    'lobby.coop': '1-4 Players (Co-op)',
    'lobby.ffa': '1-8 Players (FFA)',
    'lobby.mode': 'MODE:',
    'lobby.map': 'MAP:',
    'lobby.character': 'CHARACTER:',
    'lobby.playersReady': 'players ready',
    'lobby.checkReady': '✓ READY',
    'lobby.statusWaiting': 'WAITING',
    'lobby.enemies': 'Enemies:',
    'lobby.noEnemies': 'No enemies',

    // Game Scene
    'game.health': 'HEALTH',
    'game.score': 'SCORE',
    'game.kills': 'KILLS',
    'game.deaths': 'DEATHS',
    'game.respawning': 'Respawning in',
    'game.ultimate': 'ULTIMATE',
    'game.dodge': 'DODGE',
    'game.ready': 'READY',
    'game.cooldown': 'COOLDOWN',
    'game.killedBy': 'killed you',
    'game.youKilled': 'You killed',
    'game.gameOver': 'GAME OVER',
    'game.finalKill': 'FINAL KILL',
    'game.winner': 'WINNER',
    'game.returnToLobby': 'Returning to lobby...',
    'game.press': 'PRESS',
    'game.toRespawn': 'TO RESPAWN',

    // Kill streaks
    'streak.double': 'DOUBLE KILL!',
    'streak.triple': 'TRIPLE KILL!',
    'streak.quad': 'QUAD KILL!',
    'streak.unstoppable': 'UNSTOPPABLE!',
    'streak.godlike': 'GODLIKE!',
    'streak.legendary': 'LEGENDARY!',

    // Characters - Politics
    'char.messi.name': 'Messi',
    'char.messi.desc': 'The GOAT - Fast dribbles, deadly shots!',
    'char.milei.name': 'Milei',
    'char.milei.desc': 'VIVA LA LIBERTAD! Chainsaw economist!',
    'char.trump.name': 'Trump',
    'char.trump.desc': 'Build walls, deploy turrets, Make Arena Great Again!',
    'char.biden.name': 'Biden',
    'char.biden.desc': 'Heals allies with ice cream, steals life!',
    'char.putin.name': 'Putin',
    'char.putin.desc': 'Launches missiles, deploys bears!',

    // Characters - K-pop
    'char.jungkook.name': 'Jungkook',
    'char.jungkook.desc': 'Golden Maknae - All-rounder with explosive moves!',
    'char.momo.name': 'Momo',
    'char.momo.desc': 'Dance Queen - Speed and grace!',
    'char.haewon.name': 'Haewon',
    'char.haewon.desc': 'Vocal Power - Devastating sonic waves!',
    'char.lisa.name': 'Lisa',
    'char.lisa.desc': 'Lethal Rapper - Rapid fire and style!',
    'char.winter.name': 'Winter',
    'char.winter.desc': 'Ice Queen - Freeze your enemies!',

    // Ultimates - Politics
    'ult.goldenBall': 'Golden Ball',
    'ult.goldenBallDesc': 'Become unstoppable, rapid fire soccer balls everywhere!',
    'ult.dollarization': 'Dollarization',
    'ult.dollarizationDesc': 'AFUERA! Double damage, money explosion aura!',
    'ult.magaMech': 'MAGA Mech',
    'ult.magaMechDesc': 'Transform into a giant mech suit!',
    'ult.executiveOrder': 'Executive Order',
    'ult.executiveOrderDesc': 'Swap health with the lowest enemy!',
    'ult.nuclearStrike': 'Nuclear Strike',
    'ult.nuclearStrikeDesc': 'Rain missiles across the entire arena!',

    // Ultimates - K-pop
    'ult.dynamite': 'Dynamite',
    'ult.dynamiteDesc': 'Explosive fireworks rain from the sky!',
    'ult.fancy': 'Fancy',
    'ult.fancyDesc': 'Mesmerize enemies, slowing them drastically!',
    'ult.oo': 'O.O',
    'ult.ooDesc': 'Sonic shockwaves damage all enemies on screen!',
    'ult.money': 'Money',
    'ult.moneyDesc': 'Damage aura and increased attack speed!',
    'ult.blackMamba': 'Black Mamba',
    'ult.blackMambaDesc': 'Ice storm freezes and damages all enemies!',

    // Powerups
    'powerup.speed': 'Energy Drink',
    'powerup.damage': 'Rage Boost',
    'powerup.shield': 'Bodyguards',
    'powerup.rapidFire': 'Adrenaline',
    'powerup.health': 'First Aid',
    'powerup.ricochet': 'Bouncy Shots',

    // Stats labels
    'stats.health': 'HEALTH',
    'stats.speed': 'SPEED',
    'stats.damage': 'DAMAGE',
    'stats.fireRate': 'FIRE RATE',
    'stats.hp': 'HP',
    'stats.spd': 'SPD',
    'stats.ultimate': 'ULTIMATE',

    // Lobby extras
    'lobby.roomCode': 'ROOM CODE',
    'lobby.copyLink': 'COPY LINK',
    'lobby.selectMode': 'SELECT GAME MODE',
    'lobby.selectMap': 'SELECT MAP',
    'lobby.selectChar': 'SELECT CHARACTER',
    'lobby.readyUp': 'READY UP!',
    'lobby.mode': 'MODE:',
    'lobby.map': 'MAP:',
    'lobby.character': 'CHARACTER:',
    'lobby.playersReady': 'players ready',
    'lobby.waiting': 'WAITING',
    'lobby.next': 'NEXT →',
    'lobby.back': '← BACK',
    'lobby.cancel': 'CANCEL',
    'lobby.selected': '★ SELECTED',
    'lobby.coop': '1-4 Players (Co-op)',
    'lobby.ffa': '1-8 Players (FFA)',

    // Game extras
    'game.wave': 'WAVE',
    'game.mobs': 'Mobs:',
    'game.waveComplete': 'WAVE COMPLETE!',
    'game.choosePerk': 'CHOOSE A PERK',
    'game.time': 'Time:',
    'game.modifiers': 'MODIFIERS',
    'game.perks': 'PERKS',
    'game.finalWave': 'Final Wave:',
    'game.totalKills': 'Total Kills:',
    'game.perksCollected': 'Perks Collected:',
    'game.timeSurvived': 'Time Survived:',
    'game.returnLobby': 'RETURN TO LOBBY',
    'game.playAgain': 'PLAY AGAIN',
    'game.paused': 'PAUSED',
    'game.resume': 'RESUME',
    'game.finalScores': 'FINAL SCORES',
    'game.victory': 'VICTORY!',
    'game.ultimateReady': '[Q] ULTIMATE: READY!',
    'game.ultimateCharge': '[Q] ULTIMATE:',
    'game.streak': 'x STREAK',
    'game.controls': 'WASD: Move | Click: Shoot | SPACE: Dodge | SHIFT: Ability | Q: Ultimate',

    // Boot
    'boot.loading': 'Loading...',
    'boot.connectionFailed': 'Failed to connect to server!',

    // Misc
    'misc.connecting': 'Connecting...',
    'misc.disconnected': 'Disconnected',
    'misc.reconnecting': 'Reconnecting...',
    'misc.error': 'Error',
    'misc.roomNotFound': 'Room not found',
    'misc.roomFull': 'Room is full',
    'misc.language': 'Language',

    // Infinite Horde Mode
    'horde.title': 'Infinite Horde',
    'horde.description': 'Endless waves with boss fights every 3 waves',
    'horde.bossWave': 'BOSS WAVE',
    'horde.bossDefeated': 'BOSS DEFEATED!',
    'horde.bossesKilled': 'Bosses Killed:',
    'boss.megaBear': 'Mega Bear',
    'boss.tank': 'Tank',
    'boss.helicopter': 'Helicopter',
  },
};

export function t(key) {
  return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('gameLanguage', lang);
  }
}

export function getLanguage() {
  return currentLanguage;
}

export function toggleLanguage() {
  const newLang = currentLanguage === 'es-AR' ? 'en' : 'es-AR';
  setLanguage(newLang);
  return newLang;
}

// Load saved language preference
const savedLang = localStorage.getItem('gameLanguage');
if (savedLang && translations[savedLang]) {
  currentLanguage = savedLang;
}
