export type AssetType = "photo" | "video" | "audio" | "performance" | "phrase" | "design" | "other";

export type OwnershipStatus = "pending" | "verified" | "revoked";
export type LicensingStatus = "unavailable" | "available" | "licensed";

export type AssetRecord = {
  assetId: string;
  contentHash: string;
  metadataCommitment: string;
  assetType: AssetType;
  title: string;
  createdAt: string;
  ownershipStatus: OwnershipStatus;
  licensingStatus: LicensingStatus;
  publicProofFields: string[];
  collaboratorCount: number;
  licenseTermsHash?: string;
  royaltySplitHash?: string;
};

/** Fields the athlete may consent to disclose in a Proof Passport. */
export const DISCLOSURE_FIELDS = [
  "title",
  "assetType",
  "registrationDate",
  "ownershipVerified",
  "licenseAvailable",
  "licenseActive",
  "creatorRole",
  "collaboratorCount",
] as const;

export type DisclosureField = (typeof DISCLOSURE_FIELDS)[number];

export const DISCLOSURE_LABELS: Record<DisclosureField, string> = {
  title: "Asset title",
  assetType: "Asset category",
  registrationDate: "Registration date",
  ownershipVerified: "Ownership verified",
  licenseAvailable: "License available",
  licenseActive: "License active",
  creatorRole: "Creator role",
  collaboratorCount: "Number of collaborators",
};

export type RegisterAssetInput = {
  title: string;
  assetType: AssetType;
  createdAt: string;
  contentHash: string;
  metadataCommitment: string;
  creatorRole: string;
  collaboratorCount: number;
  publicProofFields: string[];
  licenseAvailable: boolean;
};

export type LicenseTerms = {
  assetId: string;
  usageType: string;
  territory: string;
  duration: string;
  exclusivity: "non-exclusive" | "exclusive";
  permittedUses: number;
  licenseFee: number;
  renewalOption: boolean;
  athletePercent: number;
  collaboratorPercent: number;
  advisorPercent: number;
};

/** Where a record came from. Never claim "midnight" without a real transaction. */
export type RecordSource = "midnight" | "demo";

export type TransactionResult = {
  ok: boolean;
  source: RecordSource;
  /** Real transaction id. Only ever set by the Midnight adapter. */
  txId?: string;
  /** Local record identifier (safe in demo mode). */
  recordId: string;
  error?: string;
};

export interface RightsVaultService {
  readonly source: RecordSource;
  registerAsset(input: RegisterAssetInput): Promise<TransactionResult>;
  setLicenseAvailability(assetId: string, available: boolean): Promise<TransactionResult>;
  commitLicenseTerms(assetId: string, commitment: string): Promise<TransactionResult>;
  commitRoyaltySplit(assetId: string, commitment: string): Promise<TransactionResult>;
  revokeAsset(assetId: string): Promise<TransactionResult>;
  getAsset(assetId: string): Promise<AssetRecord | null>;
  listAssets(): Promise<AssetRecord[]>;
}
