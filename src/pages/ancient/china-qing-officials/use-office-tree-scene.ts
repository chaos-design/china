import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DynastyAtlas } from "./data";
import type { OfficeTreeLayout } from "./office-tree-layout";
import type { OfficeTreeCameraPreset, OfficeTreeHover, OfficeTreePick } from "./office-tree-scene";
import { createOfficeTreeScene, readOfficeTreeColors } from "./office-tree-scene";

/**
 * 官制立体树场景的 React 生命周期所有者。
 *
 * 场景（Three.js）是命令式对象，这里只做三件事：
 * 1. 挂载时建场景、随 atlas / 布局变化同步、卸载时销毁；
 * 2. 把 React 侧回调放进 ref，避免回调身份变化触发场景重建；
 * 3. 暴露 ready / failed 状态与 retry，供 UI 层渲染加载与异常态。
 *
 * 设计要点：场景实例存进 state，同步 effect 依赖它的身份——首次创建和 retry
 * 都会自然触发一次数据同步；重试时由 createScene 负责先 dispose 旧场景再建新场景。
 */
export interface OfficeTreeSceneCallbacks {
  onHover: (hover: OfficeTreeHover | null) => void;
  onPick: (pick: OfficeTreePick | null) => void;
  onUnavailable: () => void;
}

export interface OfficeTreeSceneController {
  hostRef: React.RefObject<HTMLDivElement | null>;
  /** 场景是否已完成首次创建（成功或失败）。 */
  ready: boolean;
  /** 场景是否不可用（WebGL 缺失 / context lost）。 */
  failed: boolean;
  /** 重新创建场景（旧场景先销毁）。 */
  retry: () => void;
  applyPreset: (preset: OfficeTreeCameraPreset) => void;
  resetView: () => void;
}

export function useOfficeTreeScene(
  atlas: DynastyAtlas,
  layout: OfficeTreeLayout,
  callbacks: OfficeTreeSceneCallbacks,
): OfficeTreeSceneController {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ReturnType<typeof createOfficeTreeScene> | null>(null);
  const [scene, setScene] = useState<ReturnType<typeof createOfficeTreeScene> | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // 回调放 ref：场景只建一次，回调身份变化不应重建场景。
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const createScene = useCallback(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    if (sceneRef.current) {
      sceneRef.current.dispose();
      sceneRef.current = null;
      // scene state 必须跟 ref 同步清空：否则重建失败时，同步 effect 仍会在已销毁的场景上执行。
      setScene(null);
    }
    const created = createOfficeTreeScene(host, readOfficeTreeColors(host), {
      onHover: (hover) => {
        callbacksRef.current.onHover(hover);
      },
      onPick: (pick) => {
        callbacksRef.current.onPick(pick);
      },
      onUnavailable: () => {
        setFailed(true);
        callbacksRef.current.onUnavailable();
      },
    });
    if (!created) {
      setScene(null);
      setFailed(true);
      setReady(true);
      callbacksRef.current.onUnavailable();
      return;
    }
    sceneRef.current = created;
    setScene(created);
    setFailed(false);
    setReady(true);
  }, []);

  useEffect(() => {
    createScene();
    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [createScene]);

  useEffect(() => {
    scene?.setAtlas(atlas, layout);
  }, [scene, atlas, layout]);

  const retry = useCallback(() => {
    setReady(false);
    createScene();
  }, [createScene]);

  const applyPreset = useCallback((preset: OfficeTreeCameraPreset) => {
    sceneRef.current?.applyPreset(preset);
  }, []);

  const resetView = useCallback(() => {
    sceneRef.current?.resetView();
  }, []);

  return useMemo(
    () => ({ hostRef, ready, failed, retry, applyPreset, resetView }),
    [ready, failed, retry, applyPreset, resetView],
  );
}
