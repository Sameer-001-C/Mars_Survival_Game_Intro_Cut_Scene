import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUTSCENE_CHAPTERS,
  TOTAL_CUTSCENE_DURATION,
  getChapterStartTime,
  resolveCutsceneState,
  getLaunchCountdownValue,
  getTransitProgress,
  createInitialObjectives,
  evaluateObjectivesAtPosition,
} from './timeline';

test('cutscene has all 8 required chapters in chronological order', () => {
  assert.equal(CUTSCENE_CHAPTERS.length, 8);
  const ids = CUTSCENE_CHAPTERS.map((c) => c.id);
  assert.deepEqual(ids, [
    'earth_farewell',
    'boarding',
    'launch',
    'transit_8_months',
    'mars_landing',
    'mars_arrival_timelapse',
    'storm_evacuation',
    'awakening',
  ]);
  assert.ok(TOTAL_CUTSCENE_DURATION > 60);
});

test('resolveCutsceneState maps elapsed seconds to accurate chapter and subtitle', () => {
  const ch1 = resolveCutsceneState(1.0);
  assert.equal(ch1.chapter.id, 'earth_farewell');
  assert.equal(ch1.activeSubtitle?.speaker, 'CDR. VANCE');

  const launchStart = getChapterStartTime('launch');
  const ch3 = resolveCutsceneState(launchStart + 6.0);
  assert.equal(ch3.chapter.id, 'launch');
  assert.ok(ch3.localTime >= 5.9 && ch3.localTime <= 6.1);

  const endState = resolveCutsceneState(TOTAL_CUTSCENE_DURATION + 20);
  assert.equal(endState.chapter.id, 'awakening');
  assert.equal(endState.totalProgress, 1);
});

test('launch countdown ticks 5 down to 1 before ignition at 5.4s', () => {
  assert.equal(getLaunchCountdownValue(0.8).count, 5);
  assert.equal(getLaunchCountdownValue(0.8).ignited, false);
  assert.equal(getLaunchCountdownValue(2.0).count, 4);
  assert.equal(getLaunchCountdownValue(3.0).count, 3);
  assert.equal(getLaunchCountdownValue(4.0).count, 2);
  assert.equal(getLaunchCountdownValue(5.0).count, 1);

  const liftoff = getLaunchCountdownValue(8.0);
  assert.equal(liftoff.ignited, true);
  assert.equal(liftoff.count, 0);
  assert.ok(liftoff.altitudeKm > 0);
  assert.ok(liftoff.velocityKms > 0);
});

test('8-month transit timelapse stays at 0 during window zoom-out and reaches 8 months / 240 days by end', () => {
  const start = getTransitProgress(0);
  assert.equal(start.monthsElapsed, 0);
  assert.equal(start.daysElapsed, 0);
  assert.equal(start.progressPercent, 0);

  const zoomPhase = getTransitProgress(0.25);
  assert.equal(zoomPhase.monthsElapsed, 0);
  assert.equal(zoomPhase.daysElapsed, 0);

  const mid = getTransitProgress(0.67);
  assert.equal(mid.monthsElapsed, 4);
  assert.equal(mid.daysElapsed, 120);
  assert.equal(mid.progressPercent, 50);

  const end = getTransitProgress(1);
  assert.equal(end.monthsElapsed, 8);
  assert.equal(end.daysElapsed, 240);
  assert.equal(end.distanceMillionKm, 225);
  assert.equal(end.progressPercent, 100);
});

test('survival objectives trigger on proximity and complete when reaching Ares II Hab', () => {
  const init = createInitialObjectives();
  assert.equal(init.length, 3);
  assert.equal(init.every((o) => !o.completed), true);

  const step1 = evaluateObjectivesAtPosition(init, 12, -16);
  assert.equal(step1.newlyCompleted.length, 1);
  assert.equal(step1.newlyCompleted[0].id, 'crate');
  assert.equal(step1.allDone, false);

  const step2 = evaluateObjectivesAtPosition(step1.updated, -26, -52);
  assert.equal(step2.newlyCompleted[0].id, 'hab');
  assert.equal(step2.allDone, true);
});
