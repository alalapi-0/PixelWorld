import Phaser from 'phaser';
import sampleData from './blueprints.sample.json';
import { TileType } from '../world/Types';
import { findAsset } from '../core/AssetLocator';

type BlueprintCost = { id: string; name: string; count: number };
type Blueprint = { id: string; name: string; tile: TileType; cost: BlueprintCost[] };
interface BlueprintFile { tileSize?: number; list?: Blueprint[] }

async function fetchJson(url: string): Promise<BlueprintFile | null> {
  try {
    const response = await fetch(url, { method: 'GET', cache: 'no-cache' });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as BlueprintFile;
    return data;
  } catch (error) {
    console.warn('Failed to fetch blueprint json', error);
    return null;
  }
}

export class Blueprints {
  private items: Blueprint[] = (sampleData.list ?? []) as Blueprint[];
  private tileSize: number = sampleData.tileSize ?? 32;

  public async load(_scene: Phaser.Scene): Promise<void> {
    const located = findAsset('build/blueprints.json');
    if (located) {
      const external = await fetchJson(located.url);
      if (external?.list && external.list.length > 0) {
        this.items = external.list as Blueprint[];
        this.tileSize = external.tileSize ?? this.tileSize;
        return;
      }
    }
    const local = sampleData as BlueprintFile;
    this.items = (local.list ?? []) as Blueprint[];
    this.tileSize = local.tileSize ?? this.tileSize;
  }

  public all(): Blueprint[] {
    return this.items.slice();
  }

  public get(id: string): Blueprint | undefined {
    return this.items.find((item) => item.id === id);
  }

  public indexOf(id: string): number {
    return this.items.findIndex((item) => item.id === id);
  }

  public getTileSize(): number {
    return this.tileSize;
  }
}

export type { Blueprint, BlueprintCost };
