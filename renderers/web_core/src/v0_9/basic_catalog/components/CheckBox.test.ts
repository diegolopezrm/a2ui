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
} from '../../index.js';

describe('CheckBox Component', () => {
  let basicCatalog: Catalog<ComponentApi>;

  beforeAll(async () => {
    setupTestDom();
    basicCatalog = (await import('../index.js')).basicCatalog;
    // Ensure component is registered
    await import('./CheckBox.js');
  });

  afterAll(teardownTestDom);

  let processor: MessageProcessor<ComponentApi>;
  let surface: SurfaceModel;

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
              id: 'checkbox_invalid',
              component: 'CheckBox',
              label: 'Check me',
              value: false,
              isValid: false,
              validationErrors: ['This is required'],
            },
          ],
        },
      },
    ]);
    surface = processor.model.getSurface('test-surface')!;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render label and reflect true and false checked state', async () => {
    const el = document.createElement('a2ui-checkbox') as any;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'checkbox_invalid');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    const labelSpan = el.querySelector('.a2ui-check-box-text');
    expect(labelSpan).not.toBeNull();
    expect(labelSpan?.textContent?.trim()).toBe('Check me');

    const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input?.checked).toBe(false);

    // Update component to value: true
    processor.processMessages([
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'test-surface',
          components: [
            {
              id: 'checkbox_invalid',
              component: 'CheckBox',
              label: 'Check me',
              value: true,
            },
          ],
        },
      },
    ]);

    const contextTrue = new ComponentContext(surface, 'checkbox_invalid');
    await asyncUpdate(el, (e: any) => {
      e.context = contextTrue;
    });

    expect(input?.checked).toBe(true);
    document.body.removeChild(el);
  });

  it('should update bound data model when changed', async () => {
    processor.processMessages([
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'test-surface',
          path: '/agree',
          value: false,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'test-surface',
          components: [
            {
              id: 'cb_bound',
              component: 'CheckBox',
              label: 'Agree to terms',
              value: {path: '/agree'},
            },
          ],
        },
      },
    ]);

    const el = document.createElement('a2ui-checkbox') as any;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'cb_bound');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input?.checked).toBe(false);

    // Simulate user toggling checkbox
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(surface.dataModel.get('/agree')).toBe(true);
    document.body.removeChild(el);
  });

  it('should render validation error in CheckBox', async () => {
    const el = document.createElement('a2ui-checkbox') as any;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'checkbox_invalid');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    const errorDiv = el.querySelector('.a2ui-error-message');
    expect(errorDiv).not.toBeNull();
    expect(errorDiv?.textContent?.trim()).toBe('This is required');

    document.body.removeChild(el);
  });
});
