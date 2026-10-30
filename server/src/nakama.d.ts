// The small part of Nakama's server runtime (nakama-common, runtime.d.ts) that our module uses.
declare namespace nkruntime {
  interface Context { userId: string; username: string; env: { [key: string]: string } }
  interface Logger { info(format: string, ...params: any[]): void; warn(format: string, ...params: any[]): void; error(format: string, ...params: any[]): void }
  interface StorageReadRequest { collection: string; key: string; userId: string }
  interface StorageObject { collection: string; key: string; userId: string; value: { [key: string]: any }; version: string }
  interface StorageWriteRequest { collection: string; key: string; userId: string; value: { [key: string]: any }; version?: string; permissionRead?: number; permissionWrite?: number }
  interface StorageDeleteRequest { collection: string; key: string; userId: string }
  interface StorageObjectList { objects?: StorageObject[]; cursor?: string }
  interface Account { user: { id: string }; devices?: { id: string }[]; customId?: string; email?: string }
  interface Nakama {
    storageRead(keys: StorageReadRequest[]): StorageObject[];
    storageWrite(objects: StorageWriteRequest[]): { collection: string; key: string; userId: string; version: string }[];
    storageDelete(keys: StorageDeleteRequest[]): void;
    storageList(userId: string, collection: string, limit?: number, cursor?: string): StorageObjectList;
    accountGetId(userId: string): Account;
    accountDeleteId(userId: string, recorded?: boolean): void;
    linkDevice(userId: string, deviceId: string): void;
    unlinkDevice(userId: string, deviceId: string): void;
    linkCustom(userId: string, customId: string): void;
    sha256Hash(input: string): string;
    fileRead(relPath: string): string;
  }
  type RpcFunction = (ctx: Context, logger: Logger, nk: Nakama, payload: string) => string | void;
  interface Initializer { registerRpc(id: string, fn: RpcFunction): void }
}

// the game's numbers (data.generated.ts)
interface BoxKind { price: number; odds: { [rarity: string]: number }; pickFamily?: boolean; [key: string]: any }
interface Economy {
  boxes: { [kind: string]: BoxKind };
  rareGuaranteeAfter: number;
  sparklyChance: number;
  firstBox: string;
  spareLevels: { [rarity: string]: number[] };
  maxSquishyLevel: number;
  starsPerSpare: { [rarity: string]: number };
  minigames: { [key: string]: any };
  unlocks: { when?: any; gift?: string; [key: string]: any }[];
  [key: string]: any;
}
interface SquishyInfo { id: string; family: string; rarity: string }
