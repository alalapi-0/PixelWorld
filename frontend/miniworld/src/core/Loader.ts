import Phaser from 'phaser';
import { TextureFactory, TilesMeta, SpritesMeta } from './TextureFactory';
import { TileType } from '../world/Types';
import { findAsset, AssetSource } from './AssetLocator';

type AssetMeta = {
  tiles?: { frameWidth?: number; frameHeight?: number };
  player?: { frameWidth?: number; frameHeight?: number; frameRate?: number };
};

const TILE_SEQUENCE: TileType[] = ['GRASS', 'ROAD', 'TILE_FLOOR', 'WATER', 'LAKE', 'WALL', 'TREE', 'HOUSE', 'ROCK', 'LAVA'];
const TILE_SHEET_KEY = 'external_tilesheet';
const PLAYER_SHEET_KEY = 'external_player';

let assetSourceLabel = '占位纹理';
let tilesheetSource: AssetSource | null = null;
let playerSheetSource: AssetSource | null = null;
let cachedMeta: AssetMeta | null = null;

async function loadMeta(): Promise<AssetMeta> {
  if (cachedMeta) {
    return cachedMeta;
  }
  const located = findAsset('build/metadata.json');
  if (!located) {
    cachedMeta = {};
    return cachedMeta;
  }
  try {
    const response = await fetch(located.url, { method: 'GET', cache: 'no-cache' });
    if (!response.ok) {
      cachedMeta = {};
      return cachedMeta;
    }
    cachedMeta = (await response.json()) as AssetMeta;
  } catch (error) {
    console.warn('Failed to load asset metadata', error);
    cachedMeta = {};
  }
  return cachedMeta;
}

function transferFrame(scene: Phaser.Scene, sheetKey: string, textureKey: string, frameIndex: number): void {
  const sourceTexture = scene.textures.get(sheetKey);
  const frame = sourceTexture.get(frameIndex);
  if (!frame) {
    return;
  }
  const canvas = scene.textures.createCanvas(textureKey, frame.width, frame.height);
  const context = canvas.context;
  context.imageSmoothingEnabled = false;
  context.drawImage(
    frame.source.image,
    frame.cutX,
    frame.cutY,
    frame.cutWidth,
    frame.cutHeight,
    0,
    0,
    frame.width,
    frame.height
  );
  canvas.refresh();
}

async function loadExternalTiles(scene: Phaser.Scene): Promise<boolean> {
  const located = findAsset('tiles/tilesheet.png');
  if (!located) {
    return false;
  }
  const meta = await loadMeta();
  const frameWidth = meta.tiles?.frameWidth ?? 32;
  const frameHeight = meta.tiles?.frameHeight ?? frameWidth;
  await new Promise<void>((resolve) => {
    scene.load.spritesheet(TILE_SHEET_KEY, located.url, { frameWidth, frameHeight });
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
    scene.load.start();
  });
  tilesheetSource = located.source;
  TILE_SEQUENCE.forEach((type, index) => {
    const targetKey = `tile_${type}`;
    if (scene.textures.exists(targetKey)) {
      scene.textures.remove(targetKey);
    }
    transferFrame(scene, TILE_SHEET_KEY, targetKey, index);
  });
  return true;
}

async function loadExternalPlayer(scene: Phaser.Scene): Promise<boolean> {
  const located = findAsset('characters/player.png');
  if (!located) {
    return false;
  }
  const meta = await loadMeta();
  const frameWidth = meta.player?.frameWidth ?? 16;
  const frameHeight = meta.player?.frameHeight ?? 32;
  const frameRate = meta.player?.frameRate ?? 6;
  await new Promise<void>((resolve) => {
    scene.load.spritesheet(PLAYER_SHEET_KEY, located.url, { frameWidth, frameHeight });
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
    scene.load.start();
  });
  playerSheetSource = located.source;
  if (scene.anims.exists('player_walk')) {
    scene.anims.remove('player_walk');
  }
  const texture = scene.textures.get(PLAYER_SHEET_KEY);
  const frameTotal = texture.frameTotal;
  for (let index = 0; index < frameTotal; index += 1) {
    const frameKey = `player_idle_${index}`;
    if (scene.textures.exists(frameKey)) {
      scene.textures.remove(frameKey);
    }
    transferFrame(scene, PLAYER_SHEET_KEY, frameKey, index);
  }
  scene.anims.create({
    key: 'player_walk',
    frames: new Array(frameTotal).fill(0).map((_, idx) => ({ key: `player_idle_${idx}` })),
    frameRate,
    repeat: -1,
  });
  return true;
}

export async function loadOrFallback(scene: Phaser.Scene): Promise<void> {
  const tilesMeta: TilesMeta = TextureFactory.loadBuiltinTilesMeta();
  const spritesMeta: SpritesMeta = TextureFactory.loadBuiltinSpritesMeta();
  const tilesLoaded = await loadExternalTiles(scene);
  const playerLoaded = await loadExternalPlayer(scene);
  if (!tilesLoaded) {
    TextureFactory.createTileTextures(scene, tilesMeta);
  }
  if (!playerLoaded) {
    TextureFactory.createPlayerTextures(scene, spritesMeta);
  }
  const sources = [tilesheetSource, playerSheetSource].filter(Boolean) as AssetSource[];
  if (sources.includes('user')) {
    assetSourceLabel = '用户素材';
  } else if (sources.includes('external')) {
    assetSourceLabel = '构建素材';
  } else {
    assetSourceLabel = '占位纹理';
  }
  scene.registry.set('assetSource', assetSourceLabel);
}

export function getAssetSourceLabel(): string {
  return assetSourceLabel;
}
