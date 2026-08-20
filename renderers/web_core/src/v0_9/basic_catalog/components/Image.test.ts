/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {setupTestDom, teardownTestDom, asyncUpdate} from '../../test/dom-setup.js';
import {
  ComponentContext,
  MessageProcessor,
  Catalog,
  ComponentApi,
  SurfaceModel,
  Subscription,
} from '../../index.js';
import {ImageApi} from './basic_components.js';

describe('Image Component', () => {
  let basicCatalog: Catalog<ComponentApi>;

  beforeAll(async () => {
    setupTestDom();
    basicCatalog = (await import('../index.js')).basicCatalog;
    await import('./Image.js');
  });

  afterAll(teardownTestDom);

  let processor: MessageProcessor<ComponentApi>;
  let surface: SurfaceModel;
  let element: any = null;
  let subscription: Subscription | null = null;

  beforeEach(() => {
    processor = new MessageProcessor([basicCatalog]);
    processor.processMessages([
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'test-surface',
          catalogId: basicCatalog.id,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'test-surface',
          components: [
            {
              id: 'comp1',
              component: 'Image',
              url: 'http://example.com/image.png',
              description: 'An example image',
              variant: 'avatar',
            },
          ],
        },
      },
    ]);
    surface = processor.model.getSurface('test-surface')!;
  });

  afterEach(() => {
    subscription?.unsubscribe();
    subscription = null;
    if (element) {
      element.remove();
      element = null;
    }
  });

  it('should render img element with correct attributes and classes', async () => {
    const el = document.createElement('a2ui-image');
    element = el;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'comp1');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    expect(el).not.toBeNull();
    const img = el.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('http://example.com/image.png');
    expect(img?.getAttribute('alt')).toBe('An example image');
    expect(img?.classList.contains('a2ui-image')).toBeTrue();
    expect(img?.classList.contains('avatar')).toBeTrue();
  });

  describe('ImageApi schema validation', () => {
    it('should parse valid image with description', () => {
      const validImage = {
        url: 'https://example.com/image.png',
        description: 'An example image',
      };
      const parsed = ImageApi.schema.parse(validImage);
      expect(parsed.url).toBe('https://example.com/image.png');
      expect(parsed.description).toBe('An example image');
    });

    it('should parse valid image without description', () => {
      const validImage = {
        url: 'https://example.com/image.png',
      };
      const parsed = ImageApi.schema.parse(validImage);
      expect(parsed.url).toBe('https://example.com/image.png');
      expect(parsed.description).toBeUndefined();
    });

    it('should throw on invalid image', () => {
      const invalidImage = {
        url: 123, // Invalid type
      };
      expect(() => ImageApi.schema.parse(invalidImage)).toThrow();
    });
  });
});
