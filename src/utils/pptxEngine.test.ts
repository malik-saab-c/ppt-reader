import test from 'node:test';
import assert from 'node:assert/strict';
import { createSamplePresentation, createDefaultTemplateSlide, exportToPptxBlob } from './pptxEngine';

test('sample presentation contains 2 slides with valid coordinate bounds', () => {
  const presentation = createSamplePresentation();
  assert.equal(presentation.slides.length, 2);
  assert.equal(presentation.width, 960);
  assert.equal(presentation.height, 540);

  // Validate elements fit within canvas boundaries (no cutoff)
  for (const slide of presentation.slides) {
    for (const el of slide.elements) {
      assert.ok(el.x >= 0, `Element x (${el.x}) should be non-negative`);
      assert.ok(el.y >= 0, `Element y (${el.y}) should be non-negative`);
      assert.ok(el.x + el.width <= presentation.width, `Element right edge (${el.x + el.width}) should not exceed slide width (${presentation.width})`);
      assert.ok(el.y + el.height <= presentation.height, `Element bottom edge (${el.y + el.height}) should not exceed slide height (${presentation.height})`);
    }
  }
});

test('createDefaultTemplateSlide generates valid slide numbers and text elements', () => {
  const slide = createDefaultTemplateSlide(3);
  assert.equal(slide.slideNumber, 3);
  assert.ok(slide.elements.length >= 2);
  assert.equal(slide.elements[0].type, 'text');
  assert.ok(slide.elements[0].text && slide.elements[0].text.length > 0);
});

test('exportToPptxBlob generates a valid binary blob', async () => {
  const presentation = createSamplePresentation();
  const blob = await exportToPptxBlob(presentation);
  assert.ok(blob.size > 1000, `Blob size (${blob.size}) should be greater than 1KB`);
  assert.equal(blob.type, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
});
