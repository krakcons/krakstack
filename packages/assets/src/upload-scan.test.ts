import { PgClient } from "@effect/sql-pg";
import { describe, expect, it } from "@effect/vitest";
import { ClamAV, ClamAVError } from "@krak-stack/registry/clamav";
import { S3Service } from "@krak-stack/registry/service-s3";
import { Config, Context, Deferred, Effect, Layer, Option } from "effect";
import { TestClock } from "effect/testing";
import { SqlClient } from "effect/sql";
import { WorkflowEngine } from "effect/workflow";
import { Assets } from "./index.js";
import { FinalizeAssetUploadV1 } from "./workflow.js";
import { assetUploadScanWorkflowLayer } from "./workflows.js";

const database = PgClient.layerConfig({
  url: Config.Redacted("TEST_DATABASE_URL"),
  transformQueryNames: Config.succeed((name) =>
    name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`),
  ),
  transformResultNames: Config.succeed((name) =>
    name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
  ),
  transformJson: Config.succeed(false),
});

describe.skipIf(!process.env.TEST_DATABASE_URL)("Assets malware gate", () => {
  it.effect(
    "publishes the scanned snapshot once and preserves it after failed replacements",
    () => {
      const objects = new Map<string, Uint8Array>();
      const unused = () => Effect.die("Unexpected S3 operation");
      const storage = S3Service.testLayer({
        file: unused,
        text: unused,
        json: unused,
        bytes: unused,
        arrayBuffer: unused,
        stat: unused,
        exists: (key) => Effect.sync(() => objects.has(key)),
        size: unused,
        list: unused,
        presign: (key) => Effect.succeed(key),
        stream: (key) =>
          Effect.sync(
            () =>
              new ReadableStream<Uint8Array<ArrayBuffer>>({
                start(controller) {
                  const value = objects.get(key);
                  if (value) controller.enqueue(value.slice());
                  controller.close();
                },
              }),
          ),
        write: (key, bytes) =>
          Effect.sync(() => {
            if (!(bytes instanceof Uint8Array))
              throw new Error("Expected bytes");
            objects.set(key, bytes.slice());
            return bytes.length;
          }),
        delete: (key) =>
          Effect.sync(() => {
            objects.delete(key);
          }),
      });
      const bytes = Uint8Array.of(1, 2, 3);
      let staging = "";
      let mode: "clean" | "detected" | "offline" = "clean";
      let scanCount = 0;
      const scanner = ClamAV.layerTest({
        ping: () => Effect.void,
        scan: ({ bytes: scanned }) =>
          Effect.suspend(() => {
            expect(scanned).toEqual(bytes);
            scanCount++;
            if (mode === "offline")
              return Effect.fail(new ClamAVError({ reason: "Unavailable" }));
            objects.set(staging, Uint8Array.of(9, 9, 9));
            return Effect.succeed(
              mode === "detected"
                ? ({ _tag: "Detected", signature: "test" } as const)
                : ({ _tag: "Clean" } as const),
            );
          }),
      });
      const dependencies = Layer.mergeAll(database, scanner, storage);
      const assetsLayer = Assets.layerWithMalwareScanning.pipe(
        Layer.flatMap((layer) =>
          Layer.effectContext(
            Effect.gen(function* () {
              const assets = Context.get(layer, Assets);
              const processingStarted = yield* Deferred.make<void>();
              const releaseProcessing = yield* Deferred.make<void>();
              return Context.add(
                Context.add(Context.empty(), TestProcessing, {
                  processingStarted,
                  releaseProcessing,
                }),
                Assets,
                {
                  ...assets,
                  processScannedUpload: (...args) =>
                    Deferred.succeed(processingStarted, undefined).pipe(
                      Effect.andThen(Deferred.await(releaseProcessing)),
                      Effect.andThen(assets.processScannedUpload(...args)),
                    ),
                },
              );
            }),
          ),
        ),
        Layer.provideMerge(dependencies),
      );
      const runtime = assetUploadScanWorkflowLayer.pipe(
        Layer.provideMerge(assetsLayer),
        Layer.provideMerge(WorkflowEngine.layerMemory),
      );
      return Effect.scoped(
        Effect.gen(function* () {
          const assets = yield* Assets;
          const { processingStarted, releaseProcessing } =
            yield* TestProcessing;
          const sql = yield* SqlClient.SqlClient;
          const organizationId = crypto.randomUUID();
          const createdBy = "test-actor";
          yield* Effect.addFinalizer(() =>
            Effect.gen(function* () {
              yield* sql`DELETE FROM assets WHERE organization_id = ${organizationId}`;
              yield* sql`DELETE FROM asset_upload_publications WHERE organization_id = ${organizationId}`;
            }).pipe(Effect.orDie),
          );
          const checksum = Buffer.from(
            yield* Effect.promise(() => crypto.subtle.digest("SHA-256", bytes)),
          ).toString("hex");
          const base = {
            name: "image.png",
            mimeType: "image/png",
            byteSize: 3,
            checksum,
          };
          const stage = (assetId?: string) =>
            Effect.gen(function* () {
              const payload = { ...base, assetId };
              const upload = yield* assets.createUpload({
                organizationId,
                payload,
              });
              staging = upload.uploadUrl;
              const request = {
                organizationId,
                createdBy,
                payload: { ...payload, uploadToken: upload.uploadToken },
              };
              expect(
                (yield* assets.completeUpload(request).pipe(Effect.flip))._tag,
              ).toBe("AssetUploadInvalid");
              return {
                key: {
                  organizationId,
                  createdBy,
                  uploadToken: upload.uploadToken,
                },
                request,
                stagedKey: staging,
              };
            });
          const queue = (assetId?: string) =>
            Effect.gen(function* () {
              const staged = yield* stage(assetId);
              objects.set(staging, bytes);
              yield* assets.queueUploadScan(staged.request);
              return staged;
            });
          const waitForStatus = (
            key: Parameters<typeof assets.getUploadScan>[0],
          ) =>
            assets.getUploadScan(key).pipe(
              Effect.repeat({
                until: (result) => result.status !== "pending",
              }),
            );
          const missing = yield* stage();
          const missingExecutionId = yield* FinalizeAssetUploadV1.executionId(
            missing.key,
          );
          expect(
            (yield* assets.queueUploadScan(missing.request).pipe(Effect.flip))
              ._tag,
          ).toBe("AssetUploadInvalid");
          expect(yield* FinalizeAssetUploadV1.poll(missingExecutionId)).toEqual(
            Option.none(),
          );
          const wrongSize = yield* stage();
          objects.set(wrongSize.stagedKey, Uint8Array.of(1));
          expect(
            (yield* assets.queueUploadScan(wrongSize.request)).status,
          ).toBe("pending");
          expect((yield* waitForStatus(wrongSize.key)).status).toBe("invalid");
          expect(scanCount).toBe(0);
          expect(yield* assets.list({ organizationId })).toEqual([]);

          const { key, request, stagedKey } = yield* queue();
          yield* Deferred.await(processingStarted);
          const executionId = yield* FinalizeAssetUploadV1.executionId(key);
          expect(yield* FinalizeAssetUploadV1.poll(executionId)).toEqual(
            Option.none(),
          );
          const published = yield* assets.getUploadScan(key);
          expect(published.status).toBe("published");
          yield* Deferred.succeed(releaseProcessing, undefined);
          expect(yield* assets.queueUploadScan(request)).toEqual(published);
          expect(
            yield* assets.getUploadScan({ ...key, createdBy: "someone-else" }),
          ).toEqual({
            uploadToken: key.uploadToken,
            status: "pending",
            assetId: null,
          });
          const rows = yield* assets.list({ organizationId });
          expect(rows).toHaveLength(1);
          const [asset] = rows;
          expect(asset.objectKey).not.toBe(staging);
          expect(objects.get(asset.objectKey)).toEqual(bytes);
          expect(objects.get(staging)).toEqual(Uint8Array.of(9, 9, 9));
          const original = { payload: base, assetId: asset.id };
          expect(
            yield* assets.validateAndPublishUpload(key, original, executionId),
          ).toEqual(published);
          expect(scanCount).toBe(1);

          mode = "offline";
          const { key: replacement } = yield* queue(asset.id);
          yield* Effect.sync(() => scanCount).pipe(
            Effect.repeat({ until: (count) => count === 2 }),
          );
          expect((yield* assets.getUploadScan(replacement)).status).toBe(
            "pending",
          );
          expect(
            (yield* assets.download({ organizationId, assetId: asset.id })).url,
          ).toBe(asset.objectKey);

          mode = "detected";
          yield* TestClock.adjust("15 seconds");
          expect((yield* waitForStatus(replacement)).status).toBe("rejected");
          expect(
            (yield* assets.download({ organizationId, assetId: asset.id })).url,
          ).toBe(asset.objectKey);

          mode = "clean";
          const { key: newer } = yield* queue(asset.id);
          expect((yield* waitForStatus(newer)).status).toBe("published");
          const current = yield* assets.download({
            organizationId,
            assetId: asset.id,
          });
          expect(current.url).not.toBe(asset.objectKey);
          expect(
            (yield* assets.validateAndPublishUpload(key, original, executionId))
              .status,
          ).toBe("published");
          const stale = {
            assetId: asset.id,
            payload: { ...base, assetId: asset.id },
            previousObjectKey: asset.objectKey,
          };
          const replacementExecutionId =
            yield* FinalizeAssetUploadV1.executionId(replacement);
          expect(
            (yield* assets.validateAndPublishUpload(
              replacement,
              stale,
              replacementExecutionId,
            )).status,
          ).toBe("invalid");
          expect(
            yield* assets.download({ organizationId, assetId: asset.id }),
          ).toEqual(current);
          yield* assets.remove({ organizationId, assetId: asset.id });
          // The staging PUT can still be valid when the publish reply was lost.
          objects.set(stagedKey, bytes);
          expect(
            yield* assets.validateAndPublishUpload(key, original, executionId),
          ).toEqual(published);
          expect(yield* assets.list({ organizationId })).toEqual([]);
        }),
      ).pipe(Effect.provide(runtime));
    },
  );
});

class TestProcessing extends Context.Service<
  TestProcessing,
  {
    processingStarted: Deferred.Deferred<void>;
    releaseProcessing: Deferred.Deferred<void>;
  }
>()("assets-test/Processing") {}
