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

describe('Tabs Component', () => {
  let basicCatalog: Catalog<ComponentApi>;

  beforeAll(async () => {
    setupTestDom();
    basicCatalog = (await import('../index.js')).basicCatalog;
    await import('./Tabs.js');
    await import('./Text.js');
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
              component: 'Tabs',
              tabs: [
                {title: 'Tab 1', child: 'txt1'},
                {title: 'Tab 2', child: 'txt2'},
              ],
            },
            {id: 'txt1', component: 'Text', text: 'Content 1'},
            {id: 'txt2', component: 'Text', text: 'Content 2'},
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

  it('should render tab headers with first tab active and display first tab content', async () => {
    const el = document.createElement('a2ui-tabs');
    element = el;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'comp1');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    expect(el).not.toBeNull();
    const buttons = el.querySelectorAll('button.a2ui-tab-button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('Tab 1');
    expect(buttons[1].textContent?.trim()).toBe('Tab 2');
    expect(buttons[0].classList.contains('active')).toBeTrue();
    expect(buttons[1].classList.contains('active')).toBeFalse();

    const content = el.querySelector('.a2ui-tab-content');
    expect(content).not.toBeNull();
    expect(content?.textContent?.includes('Content 1')).toBeTrue();
    expect(content?.textContent?.includes('Content 2')).toBeFalse();
  });

  it('should switch active tab and render corresponding content when tab header is clicked', async () => {
    const el = document.createElement('a2ui-tabs');
    element = el;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'comp1');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    const buttons = el.querySelectorAll('button.a2ui-tab-button') as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(2);

    // Click Tab 2
    buttons[1].click();
    await asyncUpdate(el, () => {});

    expect(buttons[0].classList.contains('active')).toBeFalse();
    expect(buttons[1].classList.contains('active')).toBeTrue();

    const content = el.querySelector('.a2ui-tab-content');
    expect(content).not.toBeNull();
    expect(content?.textContent?.includes('Content 2')).toBeTrue();
    expect(content?.textContent?.includes('Content 1')).toBeFalse();
  });
});
