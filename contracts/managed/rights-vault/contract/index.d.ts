import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  ownerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerAsset(context: __compactRuntime.CircuitContext<PS>,
                assetId_0: Uint8Array,
                contentHash_0: Uint8Array,
                metadataCommitment_0: Uint8Array,
                available_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  setLicenseAvailability(context: __compactRuntime.CircuitContext<PS>,
                         assetId_0: Uint8Array,
                         available_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  commitLicenseTerms(context: __compactRuntime.CircuitContext<PS>,
                     assetId_0: Uint8Array,
                     termsCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  commitRoyaltySplit(context: __compactRuntime.CircuitContext<PS>,
                     assetId_0: Uint8Array,
                     splitCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeAsset(context: __compactRuntime.CircuitContext<PS>,
              assetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  verifyAssetStatus(context: __compactRuntime.CircuitContext<PS>,
                    assetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, [boolean,
                                                                                 bigint,
                                                                                 boolean]>;
}

export type ProvableCircuits<PS> = {
  registerAsset(context: __compactRuntime.CircuitContext<PS>,
                assetId_0: Uint8Array,
                contentHash_0: Uint8Array,
                metadataCommitment_0: Uint8Array,
                available_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  setLicenseAvailability(context: __compactRuntime.CircuitContext<PS>,
                         assetId_0: Uint8Array,
                         available_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  commitLicenseTerms(context: __compactRuntime.CircuitContext<PS>,
                     assetId_0: Uint8Array,
                     termsCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  commitRoyaltySplit(context: __compactRuntime.CircuitContext<PS>,
                     assetId_0: Uint8Array,
                     splitCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeAsset(context: __compactRuntime.CircuitContext<PS>,
              assetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  verifyAssetStatus(context: __compactRuntime.CircuitContext<PS>,
                    assetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, [boolean,
                                                                                 bigint,
                                                                                 boolean]>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  registerAsset(context: __compactRuntime.CircuitContext<PS>,
                assetId_0: Uint8Array,
                contentHash_0: Uint8Array,
                metadataCommitment_0: Uint8Array,
                available_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  setLicenseAvailability(context: __compactRuntime.CircuitContext<PS>,
                         assetId_0: Uint8Array,
                         available_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  commitLicenseTerms(context: __compactRuntime.CircuitContext<PS>,
                     assetId_0: Uint8Array,
                     termsCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  commitRoyaltySplit(context: __compactRuntime.CircuitContext<PS>,
                     assetId_0: Uint8Array,
                     splitCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeAsset(context: __compactRuntime.CircuitContext<PS>,
              assetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  verifyAssetStatus(context: __compactRuntime.CircuitContext<PS>,
                    assetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, [boolean,
                                                                                 bigint,
                                                                                 boolean]>;
}

export type Ledger = {
  readonly assetCount: bigint;
  assetExists: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  assetOwnerCommitment: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  assetContentHash: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  assetMetadata: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  assetStatus: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  assetSequence: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  licenseAvailable: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  licenseTermsCommitment: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  royaltySplitCommitment: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
