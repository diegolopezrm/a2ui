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
import type {A2uiBasicTextFieldElement} from './TextField.js';

describe('TextField Component', () => {
  let basicCatalog: Catalog<ComponentApi>;

  beforeAll(async () => {
    setupTestDom();
    basicCatalog = (await import('../index.js')).basicCatalog;
    await import('./TextField.js');
  });

  afterAll(teardownTestDom);

  let processor: MessageProcessor<ComponentApi>;
  let surface: SurfaceModel;
  let element: A2uiBasicTextFieldElement | null = null;

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
              id: 'field_name',
              component: 'TextField',
              label: 'Username',
              value: {path: '/user/name'},
            },
            {
              id: 'field_long',
              component: 'TextField',
              label: 'Bio',
              value: 'Initial Bio',
              variant: 'longText',
            },
            {
              id: 'field_invalid',
              component: 'TextField',
              label: 'Email',
              value: '',
              isValid: false,
              validationErrors: ['Email is required', 'Email must contain @'],
            },
          ],
        },
      },
    ]);
    surface = processor.model.getSurface('test-surface')!;
    surface.dataModel.set('/user/name', 'Bob');
  });

  afterEach(() => {
    if (element) {
      element.remove();
      element = null;
    }
  });

  it('should render input field with label and initial value', async () => {
    const el = document.createElement('a2ui-basic-textfield') as A2uiBasicTextFieldElement;
    element = el;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'field_name');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    const label = el.querySelector('label');
    expect(label).not.toBeNull();
    expect(label?.textContent?.trim()).toBe('Username');

    const input = el.querySelector('input');
    expect(input).not.toBeNull();
    expect(input?.value).toBe('Bob');
  });

  it('should update the data model value on input event', async () => {
    const el = document.createElement('a2ui-basic-textfield') as A2uiBasicTextFieldElement;
    element = el;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'field_name');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    const input = el.querySelector('input');
    expect(input).not.toBeNull();

    input!.value = 'Alice';
    input!.dispatchEvent(new Event('input'));
    await asyncUpdate(el, () => {});

    // Check that the value is updated in the data model
    expect(surface.dataModel.get('/user/name')).toBe('Alice');
  });

  it('should render textarea for longText variant', async () => {
    const el = document.createElement('a2ui-basic-textfield') as A2uiBasicTextFieldElement;
    element = el;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'field_long');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    const textarea = el.querySelector('textarea');
    expect(textarea).not.toBeNull();
    expect(textarea?.value).toBe('Initial Bio');

    const input = el.querySelector('input');
    expect(input).toBeNull();
  });

  it('should render all validation error messages when invalid', async () => {
    const el = document.createElement('a2ui-basic-textfield') as A2uiBasicTextFieldElement;
    element = el;
    document.body.appendChild(el);

    const context = new ComponentContext(surface, 'field_invalid');
    await asyncUpdate(el, (e: any) => {
      e.context = context;
    });

    const errors = el.querySelectorAll('.error');
    expect(errors.length).toBe(2);
    expect(errors[0].textContent?.trim()).toBe('Email is required');
    expect(errors[1].textContent?.trim()).toBe('Email must contain @');

    const input = el.querySelector('input');
    expect(input).not.toBeNull();
    expect(input?.classList.contains('invalid')).toBeTrue();
  });
});
