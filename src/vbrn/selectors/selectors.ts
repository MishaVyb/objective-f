import { ExcalidrawElement } from "../../element/types";
import { ObjectiveBaseMeta } from "../types";

export const getElementsMetas = (elements: readonly ExcalidrawElement[]) => {
  const metas: ObjectiveBaseMeta[] = [];
  elements.forEach((e) =>
    e.customData && e.customData.kind
      ? metas.push(e.customData as ObjectiveBaseMeta) // add link on element / element group ???
      : null,
  );
  return metas;
};
