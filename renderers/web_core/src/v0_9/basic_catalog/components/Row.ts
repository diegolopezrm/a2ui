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

import {html, nothing, css, PropertyValues} from 'lit';
import {customElement} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import {RowApi} from './basic_components.js';
import {
  BasicCatalogA2uiLitElement,
  type ResolvedChildList,
} from '../basic-catalog-a2ui-lit-element.js';
import {createComponentImplementation} from '../../catalog/types.js';

const JUSTIFY_MAP: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  spaceBetween: 'space-between',
  spaceAround: 'space-around',
  spaceEvenly: 'space-evenly',
  stretch: 'stretch',
  baseline: 'baseline',
};

const ALIGN_MAP: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

@customElement('a2ui-basic-row')
export class A2uiBasicRowElement extends BasicCatalogA2uiLitElement<typeof RowApi> {
  static override styles = css`
    a2ui-basic-row {
      display: flex;
      flex-direction: row;
      gap: var(--a2ui-row-gap, var(--a2ui-spacing-m, 16px));
    }
  `;

  protected readonly api = RowApi;

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    const props = this.controller?.props;
    if (props) {
      this.style.display = 'flex';
      this.style.flexDirection = 'row';
      this.style.gap = 'var(--a2ui-row-gap, var(--a2ui-spacing-m, 16px))';
      if (props.justify) {
        this.style.justifyContent = JUSTIFY_MAP[props.justify] || props.justify;
      } else {
        this.style.removeProperty('justify-content');
      }
      if (props.align) {
        this.style.alignItems = ALIGN_MAP[props.align] || props.align;
      } else {
        this.style.removeProperty('align-items');
      }
    }
  }

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;

    const children: ResolvedChildList = Array.isArray(props.children) ? props.children : [];
    const getKey = (child: any) =>
      typeof child === 'object' && child !== null
        ? `${child.basePath ?? ''}/${child.id}`
        : String(child);

    return html` ${repeat(children, getKey, child => html`${this.renderNode(child)}`)} `;
  }
}

export const A2uiRow = createComponentImplementation(RowApi, A2uiBasicRowElement);
