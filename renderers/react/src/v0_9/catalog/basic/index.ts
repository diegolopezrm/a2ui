/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Catalog, type FunctionImplementation} from '@a2ui/web_core/v0_9';
import {
  basicCatalog as webCoreBasicCatalog,
  BASIC_FUNCTIONS,
  createBasicCatalogFunctions,
} from '@a2ui/web_core/v0_9/basic_catalog';
import type {ReactComponentImplementation, ReactCatalogComponent} from '../../adapter';
import {toWebComponent} from '../to_web_component';

import {Text} from './components/Text';
import {Image} from './components/Image';
import {Icon} from './components/Icon';
import {Video} from './components/Video';
import {AudioPlayer} from './components/AudioPlayer';
import {Row} from './components/Row';
import {Column} from './components/Column';
import {List} from './components/List';
import {Card} from './components/Card';
import {Tabs} from './components/Tabs';
import {Divider} from './components/Divider';
import {Modal} from './components/Modal';
import {Button} from './components/Button';
import {TextField} from './components/TextField';
import {CheckBox} from './components/CheckBox';
import {ChoicePicker} from './components/ChoicePicker';
import {Slider} from './components/Slider';
import {DateTimeInput} from './components/DateTimeInput';

export * from './context/MarkdownContext';

/**
 * The set of default native React implementations for each component in the basic catalog.
 */
export const DEFAULT_COMPONENT_IMPLEMENTATIONS: Record<string, ReactComponentImplementation> = {
  Text,
  Image,
  Icon,
  Video,
  AudioPlayer,
  Row,
  Column,
  List,
  Card,
  Tabs,
  Divider,
  Modal,
  Button,
  TextField,
  CheckBox,
  ChoicePicker,
  Slider,
  DateTimeInput,
} as const;

/**
 * The set of native React UI components provided by the basic catalog.
 */
export const BASIC_COMPONENTS: ReactComponentImplementation[] = Object.values(
  DEFAULT_COMPONENT_IMPLEMENTATIONS,
);

/**
 * The set of client-side functions provided by the basic catalog.
 */
export {BASIC_FUNCTIONS};

/**
 * Interface for specifying overrides and configuration for the basic catalog.
 */
export interface BasicCatalogOptions {
  /** An optional override for the catalog's unique identifier. */
  id?: string;
  /** An optional locale to configure catalog-level formatting. */
  locale?: string;
  /** Optional overrides for individual components in the catalog. */
  components?: Partial<Record<string, ReactCatalogComponent>>;
  /** Optional additional components to include in the catalog beyond the basic catalog components. */
  extraComponents?: ReactCatalogComponent[];
  /** An optional set of function implementations to use instead of the defaults. */
  functions?: FunctionImplementation[];
}

/**
 * A basic catalog populated with React component implementations.
 */
export class BasicCatalog extends Catalog<ReactCatalogComponent> {
  constructor(options: BasicCatalogOptions = {}) {
    const id = options.id ?? webCoreBasicCatalog.id;
    const functions =
      options.functions ??
      (options.locale
        ? createBasicCatalogFunctions({locale: options.locale})
        : Array.from(webCoreBasicCatalog.functions.values()));

    const baseComponents = new Map<string, ReactCatalogComponent>(
      Object.entries(DEFAULT_COMPONENT_IMPLEMENTATIONS).map(([key, impl]) => {
        const name = impl.name || key;
        const universal = webCoreBasicCatalog.components.get(name);
        return [
          name,
          {
            ...impl,
            tagName: (impl as {tagName?: string}).tagName || universal?.tagName,
          },
        ];
      }),
    );

    if (options.components) {
      for (const [key, comp] of Object.entries(options.components)) {
        if (comp) {
          const name = comp.name || key;
          const universal =
            webCoreBasicCatalog.components.get(key) || webCoreBasicCatalog.components.get(name);
          const customTagName =
            (comp as {tagName?: string}).tagName ||
            universal?.tagName ||
            ('render' in comp && typeof (comp as ReactComponentImplementation).render === 'function'
              ? toWebComponent(comp as ReactComponentImplementation).tagName
              : undefined);
          const resolvedComp =
            comp.name === key
              ? {
                  ...comp,
                  tagName: customTagName,
                }
              : {
                  ...comp,
                  name: key,
                  tagName: customTagName,
                };
          baseComponents.set(key, resolvedComp as ReactCatalogComponent);
        }
      }
    }

    const extraComponents: ReactCatalogComponent[] = (options.extraComponents ?? []).map(comp => {
      if (!('tagName' in comp) || !comp.tagName) {
        if (
          'render' in comp &&
          typeof (comp as ReactComponentImplementation).render === 'function'
        ) {
          const wc = toWebComponent(comp as ReactComponentImplementation);
          return {
            ...comp,
            tagName: wc.tagName,
          };
        }
      }
      return comp;
    });

    const components: ReactCatalogComponent[] = [
      ...Array.from(baseComponents.values()),
      ...extraComponents,
    ];

    super(id, components, functions);
  }
}

/**
 * Default basic catalog instance.
 */
export const basicCatalog = new BasicCatalog();

export {
  Text,
  Image,
  Icon,
  Video,
  AudioPlayer,
  Row,
  Column,
  List,
  Card,
  Tabs,
  Divider,
  Modal,
  Button,
  TextField,
  CheckBox,
  ChoicePicker,
  Slider,
  DateTimeInput,
};
