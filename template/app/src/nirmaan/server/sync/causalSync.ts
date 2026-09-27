// ponytail: Monotonic tuple sorter; zero distributed lock dependencies.
import type {
  RawFieldEventInput,
  ReconciledEvent,
  SemanticCandidate,
  SemanticMatchOutput,
} from '../types';
import { matchFieldEventToActivities, extractProgressDelta } from '../matching/semanticMatcher';

export interface SyncBatchResult {
  reconciledEvents: ReconciledEvent[];
  deduplicatedCount: number;
  tamperedClockCount: number;
  autoMatchedCount: number;
  pendingReviewCount: number;
  unmatchedCount: number;
  processedItems: Array<{
    event: ReconciledEvent;
    match: SemanticMatchOutput;
    proposedProgressDelta: number;
  }>;
}

/**
 * Reorders field events causally across multiple offline field devices
 * using device-monotonic sequences and hardware timestamps.
 */
export function reconcileFieldEventsCausally(
  incomingEvents: RawFieldEventInput[],
  existingEventIds = new Set<string>(),
  lastGlobalCausalOrder: bigint = 0n
): {
  reconciled: ReconciledEvent[];
  deduplicatedCount: number;
  tamperedCount: number;
} {
  const seenIds = new Set<string>(existingEventIds);
  const validEvents: RawFieldEventInput[] = [];
  let deduplicatedCount = 0;

  // 1. Deduplicate by unique deviceId + clientEventId
  for (const ev of incomingEvents) {
    const key = `${ev.deviceId}:${ev.clientEventId}`;
    if (seenIds.has(key)) {
      deduplicatedCount++;
      continue;
    }
    seenIds.add(key);
    validEvents.push(ev);
  }

  // 2. Partition by device to verify monotonic continuity and check for clock tampering
  const eventsByDevice = new Map<string, RawFieldEventInput[]>();
  for (const ev of validEvents) {
    const list = eventsByDevice.get(ev.deviceId) || [];
    list.push(ev);
    eventsByDevice.set(ev.deviceId, list);
  }

  let tamperedCount = 0;
  const verifiedList: Array<RawFieldEventInput & { isTampered: boolean; normalizedTimeMs: number }> = [];

  for (const [, devEvents] of eventsByDevice.entries()) {
    // Sort device events strictly by monotonicSeq
    devEvents.sort((a, b) => {
      const seqA = BigInt(a.monotonicSeq);
      const seqB = BigInt(b.monotonicSeq);
      return seqA < seqB ? -1 : seqA > seqB ? 1 : 0;
    });

    let prevTimeMs = 0;
    for (let i = 0; i < devEvents.length; i++) {
      const ev = devEvents[i]!;
      const currTime = new Date(ev.eventTimestampHw).getTime();
      let isTampered = false;

      // If seq is strictly greater but timestamp jumped backwards significantly (> 60 sec)
      if (i > 0 && currTime < prevTimeMs - 60000) {
        isTampered = true;
        tamperedCount++;
      }

      // Normalization anchor: ensure timestamps preserve monotonic progression
      const normalizedTimeMs = isTampered ? prevTimeMs + 1000 : currTime;
      prevTimeMs = normalizedTimeMs;

      verifiedList.push({
        ...ev,
        isTampered,
        normalizedTimeMs,
      });
    }
  }

  // 3. Inter-device Global Causal Sort
  // Sort by normalized timestamp; if equal, break tie by deviceId and monotonicSeq
  verifiedList.sort((a, b) => {
    if (a.normalizedTimeMs !== b.normalizedTimeMs) {
      return a.normalizedTimeMs - b.normalizedTimeMs;
    }
    const seqA = BigInt(a.monotonicSeq);
    const seqB = BigInt(b.monotonicSeq);
    if (seqA !== seqB) {
      return seqA < seqB ? -1 : 1;
    }
    return a.deviceId.localeCompare(b.deviceId);
  });

  // 4. Assign Monotonic Reconciled Causal Orders
  let currentOrder = lastGlobalCausalOrder;
  const now = new Date();

  const reconciled: ReconciledEvent[] = verifiedList.map(item => {
    currentOrder += 1n;
    return {
      clientEventId: item.clientEventId,
      deviceId: item.deviceId,
      supervisorId: item.supervisorId,
      sourceType: item.sourceType,
      rawText: item.rawText,
      audioRecordingUrl: item.audioRecordingUrl,
      eventTimestampHw: item.eventTimestampHw,
      monotonicSeq: item.monotonicSeq,
      reconciledCausalOrder: currentOrder,
      syncReceivedAt: now,
      isClockTampered: item.isTampered,
    };
  });

  return {
    reconciled,
    deduplicatedCount,
    tamperedCount,
  };
}

/**
 * End-to-end ingestion pipeline:
 * Takes field event batch -> reconciles causally -> runs semantic matcher against candidates.
 */
export function processFieldEventsBatch(
  incomingEvents: RawFieldEventInput[],
  candidates: SemanticCandidate[],
  existingKeys = new Set<string>(),
  lastGlobalCausalOrder = 0n
): SyncBatchResult {
  const { reconciled, deduplicatedCount, tamperedCount } = reconcileFieldEventsCausally(
    incomingEvents,
    existingKeys,
    lastGlobalCausalOrder
  );

  let autoMatchedCount = 0;
  let pendingReviewCount = 0;
  let unmatchedCount = 0;

  const processedItems: SyncBatchResult['processedItems'] = [];

  for (const event of reconciled) {
    const match = matchFieldEventToActivities(event.rawText, candidates);
    const delta = extractProgressDelta(event.rawText);

    if (match.status === 'AUTO_MATCHED') autoMatchedCount++;
    else if (match.status === 'PENDING_REVIEW') pendingReviewCount++;
    else unmatchedCount++;

    processedItems.push({
      event,
      match,
      proposedProgressDelta: delta,
    });
  }

  return {
    reconciledEvents: reconciled,
    deduplicatedCount,
    tamperedClockCount: tamperedCount,
    autoMatchedCount,
    pendingReviewCount,
    unmatchedCount,
    processedItems,
  };
}
