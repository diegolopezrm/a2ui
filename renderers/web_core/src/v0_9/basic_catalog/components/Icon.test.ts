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

describe('Icon Component', () => {
  let basicCatalog: Catalog<ComponentApi>;

  beforeAll(async () => {
    setupTestDom();
    basicCatalog = (await import('../index.js')).basicCatalog;
    await import('./Icon.js');
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
              id: 'icon_plain',
              component: 'Icon',
              name: 'play',
            },
            {
              id: 'icon_svg',
              component: 'Icon',
              name: {
                svgPath: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
              },
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

  it('should render plain material icon <i> with correct classes and name override', async () => {
    const el = document.createElement('a2ui-icon');
    element = el;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'icon_plain');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    expect(el).not.toBeNull();
    const i = el.querySelector('i');
    expect(i).not.toBeNull();
    expect(i?.classList.contains('material-icons')).toBeTrue();
    expect(i?.classList.contains('a2ui-icon')).toBeTrue();
    expect(i?.textContent?.trim()).toBe('play_arrow');
  });

  it('should render svg icon with svgPath', async () => {
    const el = document.createElement('a2ui-icon');
    element = el;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'icon_svg');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    expect(el).not.toBeNull();
    const svg = el.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.classList.contains('a2ui-icon')).toBeTrue();
    expect(svg?.classList.contains('svg')).toBeTrue();
    const path = svg?.querySelector('path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('d')).toBe('M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z');
  });
});
