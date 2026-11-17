import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { OfficialsDynastyId } from "../china-officials/officials-data";
import type { RankTreeSpan } from "./rank-tree-layout";
import {
  createRankTreeScene,
  type RankTreeCameraPreset,
  type RankTreeHover,
  type RankTreePick,
  type RankTreeScene,
  type RankTreeSceneEntry,
  readRankTreeColors,
} from "./rank-tree-scene";

/**
 * 立体树场景的 React 生命周期所有者。
 *
 * 场景本身（Three.js）是命令式对象，这里只做三件事：
 * 1. 挂载时建场景、同步数据/焦点/选中态到场景、卸载时销毁；
 * 2. 把 React 侧回调放进 ref，避免回调身份变化触发场景重建；
 * 3. 暴露 ready / failed 状态与命令式操作，供 UI 层渲染加载与异常态。
 *
 * 设计要点：场景实例存进 state，所有同步 effect 依赖它的身份 —— 首次创建和 retry
 * 都会自然触发一次数据同步；重试时由 createScene 负责先 dispose 旧场景再建新场景。
 */
export interface RankTreeSceneCallbacks {
  onHover: (hover: RankTreeHover | null) => void;
  onPick: (pick: RankTreePick | null) => void;
  onUnavailable: () => void;
}

export interface RankTreeSceneSync {
  entries: readonly RankTreeSceneEntry[];
  span: RankTreeSpan;
  focus: { main: RankTreePick | null; compare: RankTreePick | null };
  selected: RankTreePick | null;
  autoRotate: boolean;
}

export interface RankTreeSceneController {
  hostRef: React.RefObject<HTMLDivElement | null>;
  /** 场景是否已完成首次创建（成功或失败）。 */
  ready: boolean;
  /** 场景是否不可用（WebGL 缺失 / context lost）。 */
  failed: boolean;
  /** 重新创建场景（旧场景先销毁）。 */
  retry: () => void;
  applyPreset: (preset: RankTreeCameraPreset) => void;
  resetView: () => void;
  focusTier: (dynastyId: OfficialsDynastyId, gradeIndex: number) => void;
}

export function useRankTreeScene(
  sync: RankTreeSceneSync,
  callbacks: RankTreeSceneCallbacks,
): RankTreeSceneController {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<RankTreeScene | null>(null);
  const [scene, setScene] = useState<RankTreeScene | null>(null);
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
    const created = createRankTreeScene(host, readRankTreeColors(host), {
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
    if (!scene) {
      return;
    }
    scene.setTrees([...sync.entries], { span: sync.span });
  }, [scene, sync.entries, sync.span]);

  useEffect(() => {
    if (!scene) {
      return;
    }
    scene.setFocus(sync.focus.main, sync.focus.compare);
  }, [scene, sync.focus]);

  useEffect(() => {
    scene?.setSelection(sync.selected);
  }, [scene, sync.selected]);

  useEffect(() => {
    scene?.setAutoRotate(sync.autoRotate);
  }, [scene, sync.autoRotate]);

  const retry = useCallback(() => {
    setReady(false);
    createScene();
  }, [createScene]);

  const applyPreset = useCallback((preset: RankTreeCameraPreset) => {
    sceneRef.current?.applyPreset(preset);
  }, []);

  const resetView = useCallback(() => {
    sceneRef.current?.resetView();
  }, []);

  const focusTier = useCallback((dynastyId: OfficialsDynastyId, gradeIndex: number) => {
    sceneRef.current?.focusTier(dynastyId, gradeIndex);
  }, []);

  return useMemo(
    () => ({ hostRef, ready, failed, retry, applyPreset, resetView, focusTier }),
    [ready, failed, retry, applyPreset, resetView, focusTier],
  );
}
