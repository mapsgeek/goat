import { createSelector } from "@reduxjs/toolkit";

import { SYSTEM_LAYERS_IDS } from "@/lib/constants";
import type { RootState } from "@/lib/store";

export const selectProjectLayers = (state: RootState) => state.layers.projectLayers;
export const selectProjectLayerGroups = (state: RootState) => state.layers.projectLayerGroups;
export const selectProject = (state: RootState) => state.map.project;

export const selectFilteredProjectLayers = createSelector(
  [
    selectProjectLayers,
    selectProjectLayerGroups,
    (_: RootState, excludeLayerTypes: string[] = []) => excludeLayerTypes,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_: RootState, _1: any, _2: any, excludeLayerIds: string[] = [...SYSTEM_LAYERS_IDS]) => excludeLayerIds,
  ],
  (projectLayers, projectLayerGroups, excludeLayerTypes, excludeLayerIds) => {
    if (!projectLayers) return [];

    // First filter by layer type and system layers
    let filteredLayers = projectLayers.filter(
      (layer) => !excludeLayerTypes.includes(layer.type) && !excludeLayerIds.includes(layer.layer_id)
    );

    // Then filter out layers that belong to invisible groups and apply
    // tree-aware DFS traversal so the rendering order matches the visual
    // layer panel hierarchy (layers inside a group inherit the group's position).
    if (projectLayerGroups && projectLayerGroups.length > 0) {
      // Create a set of invisible group IDs (including nested invisible groups)
      const invisibleGroupIds = new Set<number>();

      const findInvisibleGroups = (groups: typeof projectLayerGroups) => {
        groups.forEach((group) => {
          // Get visibility from properties (default to true if not set)
          const groupVisibility = group.properties?.visibility ?? true;
          if (!groupVisibility) {
            invisibleGroupIds.add(group.id);
          }
          // Also check if parent group is invisible
          if (group.parent_id && invisibleGroupIds.has(group.parent_id)) {
            invisibleGroupIds.add(group.id);
          }
        });
      };

      // Run multiple times to catch nested invisible groups
      let previousSize = -1;
      while (invisibleGroupIds.size !== previousSize) {
        previousSize = invisibleGroupIds.size;
        findInvisibleGroups(projectLayerGroups);
      }

      // Filter out layers that belong to invisible groups
      filteredLayers = filteredLayers.filter((layer) => {
        if (!layer.layer_project_group_id) {
          return true; // Layer not in any group, so it's visible
        }
        return !invisibleGroupIds.has(layer.layer_project_group_id);
      });

      // DFS traversal to order layers by group hierarchy
      type TreeNode = {
        type: "group" | "layer";
        id: number;
        order: number;
        layer?: (typeof filteredLayers)[number];
      };
      const childrenByParent = new Map<number | null, TreeNode[]>();

      for (const group of projectLayerGroups) {
        if (invisibleGroupIds.has(group.id)) continue;
        const parentKey = group.parent_id ?? null;
        if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
        childrenByParent.get(parentKey)!.push({ type: "group", id: group.id, order: group.order ?? 0 });
      }

      for (const layer of filteredLayers) {
        const parentKey = layer.layer_project_group_id ?? null;
        if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
        childrenByParent.get(parentKey)!.push({ type: "layer", id: layer.id, order: layer.order ?? 0, layer });
      }

      for (const children of childrenByParent.values()) {
        children.sort((a, b) => a.order - b.order);
      }

      const orderedLayers: (typeof filteredLayers)[number][] = [];
      const collectLayers = (parentId: number | null) => {
        const children = childrenByParent.get(parentId);
        if (!children) return;
        for (const child of children) {
          if (child.type === "layer" && child.layer) {
            orderedLayers.push(child.layer);
          } else if (child.type === "group") {
            collectLayers(child.id);
          }
        }
      };
      collectLayers(null);

      return orderedLayers;
    }

    return filteredLayers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
);
