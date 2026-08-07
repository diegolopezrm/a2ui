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

import {setupTestDom, teardownTestDom, asyncUpdate} from '../test/dom-setup.js';

import {ComponentContext} from '../rendering/component-context.js';
import {MessageProcessor} from '../processing/message-processor.js';
import {A2uiLitElement} from './a2ui-lit-element.js';
import {basicCatalog} from '../basic_catalog/catalog.js';
import {TextApi} from '../basic_catalog/components/basic_components.js';

/**
 * These tests ensure that:
 * - The element correctly instantiates an `A2uiController` when its ComponentContext is assigned.
 * - Changing the element's ComponentContext safely tears down the old controller and creates a new one.
 */
describe('A2uiLitElement', () => {
  let controllerCreatedCount = 0;
  let disposedCount = 0;

  // Tracks the return value of renderNode() in TestA2uiElement to verify rendering behavior in tests.
  let lastRenderResult: any = null;

  beforeAll(async () => {
    setupTestDom();

    // Create a mock subclass to intercept and track controller lifecycle events
    class TestA2uiElement extends A2uiLitElement<any> {
      createController() {
        controllerCreatedCount++;
        return {
          dispose: () => {
            disposedCount++;
          },
        } as any;
      }

      override render() {
        lastRenderResult = this.renderNode('child_id');
        return lastRenderResult;
      }
    }

    customElements.define('test-a2ui-element', TestA2uiElement);
  });

  afterAll(teardownTestDom);

  let processor: MessageProcessor<any>;
  let surface: any;

  beforeEach(() => {
    controllerCreatedCount = 0;
    disposedCount = 0;
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
              id: 'root',
              component: 'Text',
              text: 'Root',
            },
            {
              id: 'child_id',
              component: 'Text',
              text: 'Child',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'test-surface',
          path: '/',
          value: {myData: 'hello'},
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'test-surface',
          path: '/child_id',
          value: {myData: 'world'},
        },
      },
    ]);

    surface = processor.model.getSurface('test-surface')!;
  });

  it('should default to Shadow DOM rendering (creates a ShadowRoot)', () => {
    const el = document.createElement('test-a2ui-element') as any;
    expect(el.createRenderRoot()).not.toBe(el);
    expect(
      el.createRenderRoot() instanceof (globalThis as any).ShadowRoot ||
        el.createRenderRoot() !== el,
    ).toBeTrue();
  });

  it('should create controller when context is set', async () => {
    const el = document.createElement('test-a2ui-element') as any;
    document.body.appendChild(el);

    expect(controllerCreatedCount).toBe(0);

    const context = new ComponentContext(surface, 'root');
    await asyncUpdate(el, e => {
      e.context = context;
    });

    expect(controllerCreatedCount).toBe(1);
    document.body.removeChild(el);
  });

  it('should dispose old controller and create new one when context changes', async () => {
    const el = document.createElement('test-a2ui-element') as any;
    document.body.appendChild(el);

    const context1 = new ComponentContext(surface, 'root');
    await asyncUpdate(el, e => {
      e.context = context1;
    });

    expect(controllerCreatedCount).toBe(1);
    expect(disposedCount).toBe(0);

    const context2 = new ComponentContext(surface, 'child_id');
    await asyncUpdate(el, e => {
      e.context = context2;
    });

    expect(disposedCount).toBe(1);
    expect(controllerCreatedCount).toBe(2);

    document.body.removeChild(el);
  });

  it('should return nothing when component is removed from surface', async () => {
    const {nothing} = await import('lit');

    const el = document.createElement('test-a2ui-element') as any;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'root');
    await asyncUpdate(el, e => {
      e.context = context;
    });

    surface.componentsModel.removeComponent('root');

    await asyncUpdate(el, e => {
      e.requestUpdate();
    });

    expect(lastRenderResult).toBe(nothing);

    document.body.removeChild(el);
  });

  it('should return nothing when surface is disposed', async () => {
    const {nothing} = await import('lit');

    const el = document.createElement('test-a2ui-element') as any;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'root');
    await asyncUpdate(el, e => {
      e.context = context;
    });

    surface.dispose();

    await asyncUpdate(el, e => {
      e.requestUpdate();
    });

    expect(lastRenderResult).toBe(nothing);

    document.body.removeChild(el);
  });

  it('should automatically instantiate controller when api property is defined', async () => {
    class TestApiElement extends A2uiLitElement<typeof TextApi> {
      protected override readonly api = TextApi;
    }
    customElements.define('test-api-element', TestApiElement);

    const el = document.createElement('test-api-element') as TestApiElement;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'root');
    await asyncUpdate(el, e => {
      e.context = context;
    });

    expect(el.controller).toBeDefined();
    expect(el.controller?.props.text).toBe('Root');

    document.body.removeChild(el);
  });
});
