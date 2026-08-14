import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { DraggableObject, XYBounds, XYPosition } from "./types";

type PointerCaptureTarget = {
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
  hasPointerCapture?: (pointerId: number) => boolean;
};

type DragSession = {
  pointerId: number;
  plane: THREE.Plane;
  worldToModel: THREE.Matrix4;
  startPointer: THREE.Vector3;
  startPosition: XYPosition;
  captureTarget: PointerCaptureTarget | null;
};

type Options = {
  enabled: boolean;
  object: DraggableObject;
  position: XYPosition;
  bounds: XYBounds;
  coordinateRoot: RefObject<THREE.Group | null>;
  onPositionChange: (x: number, y: number) => void;
  onSelect: (object: DraggableObject) => void;
  onDragStart: (object: DraggableObject) => void;
  onDragEnd: (object: DraggableObject) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundMillimeters(value: number) {
  return Math.round(value);
}

export default function useDraggableXY({
  enabled,
  object,
  position,
  bounds,
  coordinateRoot,
  onPositionChange,
  onSelect,
  onDragStart,
  onDragEnd,
}: Options) {
  const { gl } = useThree();
  const sessionRef = useRef<DragSession | null>(null);
  const pendingPositionRef = useRef<XYPosition | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hoveredRef = useRef(false);
  const objectRef = useRef(object);
  const callbacksRef = useRef({ onPositionChange, onSelect, onDragStart, onDragEnd });
  objectRef.current = object;
  callbacksRef.current = { onPositionChange, onSelect, onDragStart, onDragEnd };

  const flushPosition = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const pending = pendingPositionRef.current;
    pendingPositionRef.current = null;
    if (pending) callbacksRef.current.onPositionChange(pending.x, pending.y);
  }, []);

  const finishDrag = useCallback((pointerId?: number, clearHover = false) => {
    const session = sessionRef.current;
    if (!session || (pointerId !== undefined && session.pointerId !== pointerId)) return;

    flushPosition();
    try {
      const hasCapture = session.captureTarget?.hasPointerCapture;
      if (!hasCapture || hasCapture.call(session.captureTarget, session.pointerId)) {
        session.captureTarget?.releasePointerCapture?.(session.pointerId);
      }
    } catch {
      // The browser can release capture before pointerup reaches React Three Fiber.
    }

    sessionRef.current = null;
    if (clearHover) hoveredRef.current = false;
    gl.domElement.style.cursor = hoveredRef.current ? "grab" : "default";
    callbacksRef.current.onDragEnd(objectRef.current);
  }, [flushPosition, gl.domElement]);

  useEffect(() => {
    const handlePointerUp = (event: PointerEvent) => finishDrag(event.pointerId, true);
    const handlePointerCancel = (event: PointerEvent) => finishDrag(event.pointerId, true);
    const handleWindowBlur = () => finishDrag(undefined, true);

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("blur", handleWindowBlur);
      finishDrag();
    };
  }, [finishDrag]);

  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!enabled || event.nativeEvent.button !== 0 || sessionRef.current) return;

    const root = coordinateRoot.current;
    if (!root) return;

    event.stopPropagation();
    root.updateWorldMatrix(true, false);

    const worldQuaternion = root.getWorldQuaternion(new THREE.Quaternion());
    const planeNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuaternion).normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, event.point);
    const worldToModel = root.matrixWorld.clone().invert();
    const startWorld = event.ray.intersectPlane(plane, new THREE.Vector3()) ?? event.point.clone();
    const captureTarget = event.target as unknown as PointerCaptureTarget;

    sessionRef.current = {
      pointerId: event.pointerId,
      plane,
      worldToModel,
      startPointer: startWorld.applyMatrix4(worldToModel),
      startPosition: { ...position },
      captureTarget,
    };
    captureTarget.setPointerCapture?.(event.pointerId);
    gl.domElement.style.cursor = "grabbing";
    callbacksRef.current.onSelect(objectRef.current);
    callbacksRef.current.onDragStart(objectRef.current);
  }, [coordinateRoot, enabled, gl.domElement, position]);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    event.stopPropagation();
    const intersection = event.ray.intersectPlane(session.plane, new THREE.Vector3());
    if (!intersection) return;

    const pointer = intersection.applyMatrix4(session.worldToModel);
    pendingPositionRef.current = {
      x: clamp(
        roundMillimeters(session.startPosition.x + pointer.x - session.startPointer.x),
        bounds.minX,
        bounds.maxX,
      ),
      y: clamp(
        roundMillimeters(session.startPosition.y + pointer.y - session.startPointer.y),
        bounds.minY,
        bounds.maxY,
      ),
    };

    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = null;
        const pending = pendingPositionRef.current;
        pendingPositionRef.current = null;
        if (pending) callbacksRef.current.onPositionChange(pending.x, pending.y);
      });
    }
  }, [bounds]);

  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!enabled) return;
    event.stopPropagation();
    hoveredRef.current = true;
    if (!sessionRef.current) gl.domElement.style.cursor = "grab";
  }, [enabled, gl.domElement]);

  const handlePointerOut = useCallback(() => {
    hoveredRef.current = false;
    if (!sessionRef.current) gl.domElement.style.cursor = "default";
  }, [gl.domElement]);

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      const stillOverObject = event.intersections.some(
        (intersection) => intersection.object === event.eventObject,
      );
      finishDrag(event.pointerId, !stillOverObject);
    },
    onPointerCancel: (event: ThreeEvent<PointerEvent>) => finishDrag(event.pointerId, true),
    onLostPointerCapture: (event: ThreeEvent<PointerEvent>) => finishDrag(event.pointerId, true),
    onPointerOver: handlePointerOver,
    onPointerOut: handlePointerOut,
  };
}
