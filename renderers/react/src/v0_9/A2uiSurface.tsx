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

import React, {useSyncExternalStore, memo, useMemo, useCallback, useRef, useEffect} from 'react';
import {type SurfaceModel, ComponentContext, type ComponentModel} from '@a2ui/web_core/v0_9';
import {basicCatalog as webCoreBasicCatalog} from '@a2ui/web_core/v0_9/basic_catalog';
import type {ReactComponentImplementation, ReactCatalogComponent} from './adapter';
import {useA2UI} from './core/A2UIProvider';

const WebComponentNode = memo(
  ({tagName, context}: {tagName: string; context: ComponentContext}) => {
    const elRef = useRef<HTMLElement | null>(null);
    const contextRef = useRef(context);
    contextRef.current = context;

    const setRef = useCallback((node: HTMLElement | null) => {
      elRef.current = node;
      if (node) {
        (node as unknown as {context?: ComponentContext}).context = contextRef.current;
      }
    }, []);

    useEffect(() => {
      if (elRef.current) {
        (elRef.current as unknown as {context?: ComponentContext}).context = context;
      }
    }, [context]);

    return React.createElement(tagName, {ref: setRef});
  },
);
WebComponentNode.displayName = 'WebComponentNode';

const ResolvedChild = memo(
  ({
    surface,
    id,
    basePath,
    compImpl,
    componentModel,
  }: {
    surface: SurfaceModel<ReactCatalogComponent>;
    id: string;
    basePath: string;
    componentModel: ComponentModel;
    compImpl: ReactCatalogComponent;
  }) => {
    // Create context. Recreate if the componentModel instance changes (e.g. type change recreation).
    const context = useMemo(
      () => new ComponentContext(surface, id, basePath),
      // componentModel is used as a trigger for recreation even if not in the body
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [surface, id, basePath, componentModel],
    );

    const buildChild = useCallback(
      (childId: string, specificPath?: string) => {
        const path = specificPath || context.dataContext.path;
        return (
          <DeferredChild
            key={`${childId}-${path}`}
            surface={surface}
            id={childId}
            basePath={path}
          />
        );
      },
      [surface, context.dataContext.path],
    );

    const {useUniversalComponents} = useA2UI();

    if (useUniversalComponents) {
      const universalComp =
        'tagName' in compImpl && compImpl.tagName
          ? compImpl
          : webCoreBasicCatalog.components.get(componentModel.type);
      if (universalComp && 'tagName' in universalComp && universalComp.tagName) {
        return <WebComponentNode tagName={universalComp.tagName} context={context} />;
      }
    }

    if (
      'render' in compImpl &&
      typeof (compImpl as ReactComponentImplementation).render === 'function'
    ) {
      const ComponentToRender = (compImpl as ReactComponentImplementation).render;
      return <ComponentToRender context={context} buildChild={buildChild} />;
    }

    if ('tagName' in compImpl && compImpl.tagName) {
      return <WebComponentNode tagName={compImpl.tagName} context={context} />;
    }

    return null;
  },
);
ResolvedChild.displayName = 'ResolvedChild';

export const DeferredChild: React.FC<{
  surface: SurfaceModel<ReactCatalogComponent>;
  id: string;
  basePath: string;
}> = memo(({surface, id, basePath}) => {
  // 1. Subscribe specifically to this component's existence
  const store = useMemo(() => {
    let version = 0;
    return {
      subscribe: (cb: () => void) => {
        const unsub1 = surface.componentsModel.onCreated.subscribe(comp => {
          if (comp.id === id) {
            version++;
            cb();
          }
        });
        const unsub2 = surface.componentsModel.onDeleted.subscribe(delId => {
          if (delId === id) {
            version++;
            cb();
          }
        });
        return () => {
          unsub1.unsubscribe();
          unsub2.unsubscribe();
        };
      },
      getSnapshot: () => {
        const comp = surface.componentsModel.get(id);
        // We use instance identity + version as the snapshot to ensure
        // type replacements (e.g. Button -> Text) trigger a re-render.
        return comp ? `${comp.type}-${version}` : `missing-${version}`;
      },
    };
  }, [surface, id]);

  useSyncExternalStore(store.subscribe, store.getSnapshot);

  const componentModel = surface.componentsModel.get(id);

  if (!componentModel) {
    return <div style={{color: 'gray', padding: '4px'}}>[Loading {id}...]</div>;
  }

  const compImpl = surface.catalog.components.get(componentModel.type);

  if (!compImpl) {
    return <div style={{color: 'red'}}>Unknown component: {componentModel.type}</div>;
  }

  return (
    <ResolvedChild
      surface={surface}
      id={id}
      basePath={basePath}
      componentModel={componentModel}
      compImpl={compImpl}
    />
  );
});
DeferredChild.displayName = 'DeferredChild';

export const A2uiSurface: React.FC<{surface: SurfaceModel<ReactCatalogComponent>}> = ({
  surface,
}) => {
  // The root component always has ID 'root' and base path '/'
  return <DeferredChild surface={surface} id="root" basePath="/" />;
};
