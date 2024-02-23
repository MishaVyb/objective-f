import React from "react";
import { getCommonBounds } from "../element/bounds";
import { NonDeletedExcalidrawElement } from "../element/types";
import { t } from "../i18n";
import { getTargetElements } from "../scene";
import { ExcalidrawProps, UIAppState } from "../types";
import { CloseIcon } from "./icons";
import { Island } from "./Island";
import "./Stats.scss";
import { isLinearElement } from "../element/typeChecks";
import { LinearElementEditor } from "../element/linearElementEditor";
import { getAngDeg, getLineFunc } from "../../../src/_objective_/elements/math";

export const Stats = (props: {
  appState: UIAppState;
  setAppState: React.Component<any, UIAppState>["setState"];
  elements: readonly NonDeletedExcalidrawElement[];
  onClose: () => void;
  renderCustomStats: ExcalidrawProps["renderCustomStats"];
}) => {
  const boundingBox = getCommonBounds(props.elements);
  const selectedElements = getTargetElements(props.elements, props.appState);
  const selectedBoundingBox = getCommonBounds(selectedElements);

  const objectiveStats = () => {
    const selectedElement = selectedElements[0];
    const singleElementInfo =
      selectedElements.length === 1 ? (
        <>
          <tr>
            <td>{"pinter x y (see debug console)"}</td>
          </tr>
          <tr>
            <td>{"x y"}</td>
            <td>{Math.round(selectedElements[0].x)}</td>
            <td>{Math.round(selectedElements[0].y)}</td>
          </tr>
          <tr>
            <td>{"w h"}</td>
            <td>{Math.round(selectedElements[0].width)}</td>
            <td>{Math.round(selectedElements[0].height)}</td>
          </tr>
        </>
      ) : null;
    const linerElementInfo =
      selectedElements.length === 1 && isLinearElement(selectedElement) ? (
        <>
          <tr>
            <td>{"absolute line parts"}</td>
          </tr>
          {selectedElement.points.map((currentPoint, i, points) => {
            if (i === 0) return <tr key={i}></tr>;
            const prevPoint = points[i - 1];
            const absStart = LinearElementEditor.getPointGlobalCoordinates(
              selectedElement,
              prevPoint,
            );
            const absEnd = LinearElementEditor.getPointGlobalCoordinates(
              selectedElement,
              currentPoint,
            );
            const ang = getAngDeg(absStart, absEnd);
            const func = getLineFunc(absStart, absEnd);
            const funcStr = ` | func y = ${func.slope} * x + ${func.intercept}`;

            return (
              <tr key={i}>
                <td>
                  {i}
                  {") start "}
                  {Math.round(absStart[0])}
                  {"-"}
                  {Math.round(absStart[1])}
                  {" | end "}
                  {Math.round(absEnd[0])}
                  {"-"}
                  {Math.round(absEnd[1])}
                  {" | angle "}
                  {Math.round(ang)}
                  {funcStr}
                </td>
              </tr>
            );
          })}
          <tr>
            <td>{"relative line parts"}</td>
          </tr>
          {selectedElement.points.map((currentPoint, i, points) => {
            if (i === 0) return <tr key={i}></tr>;
            const prevPoint = points[i - 1];
            const ang = getAngDeg(prevPoint, currentPoint);
            return (
              <tr key={i}>
                <td>
                  {i}
                  {") start "}
                  {Math.round(prevPoint[0])}
                  {"-"}
                  {Math.round(prevPoint[1])}
                  {" | end "}
                  {Math.round(currentPoint[0])}
                  {"-"}
                  {Math.round(currentPoint[1])}
                  {" | angle "}
                  {Math.round(ang)}
                </td>
              </tr>
            );
          })}
        </>
      ) : null;

    return (
      <>
        <tr>
          <th colSpan={2}>{"Objective"}</th>
        </tr>
        {singleElementInfo}
        {linerElementInfo}
      </>
    );
  };

  return (
    <div className="Stats">
      <Island padding={2}>
        <div className="close" onClick={props.onClose}>
          {CloseIcon}
        </div>
        <h3>{t("stats.title")}</h3>
        <table>
          <tbody>
            <tr>
              <th colSpan={2}>{t("stats.scene")}</th>
            </tr>
            <tr>
              <td>{t("stats.elements")}</td>
              <td>{props.elements.length}</td>
            </tr>
            <tr>
              <td>{t("stats.width")}</td>
              <td>{Math.round(boundingBox[2]) - Math.round(boundingBox[0])}</td>
            </tr>
            <tr>
              <td>{t("stats.height")}</td>
              <td>{Math.round(boundingBox[3]) - Math.round(boundingBox[1])}</td>
            </tr>

            {selectedElements.length === 1 && (
              <tr>
                <th colSpan={2}>{t("stats.element")}</th>
              </tr>
            )}

            {selectedElements.length > 1 && (
              <>
                <tr>
                  <th colSpan={2}>{t("stats.selected")}</th>
                </tr>
                <tr>
                  <td>{t("stats.elements")}</td>
                  <td>{selectedElements.length}</td>
                </tr>
              </>
            )}
            {selectedElements.length > 0 && (
              <>
                <tr>
                  <td>{"x"}</td>
                  <td>{Math.round(selectedBoundingBox[0])}</td>
                </tr>
                <tr>
                  <td>{"y"}</td>
                  <td>{Math.round(selectedBoundingBox[1])}</td>
                </tr>
                <tr>
                  <td>{t("stats.width")}</td>
                  <td>
                    {Math.round(
                      selectedBoundingBox[2] - selectedBoundingBox[0],
                    )}
                  </td>
                </tr>
                <tr>
                  <td>{t("stats.height")}</td>
                  <td>
                    {Math.round(
                      selectedBoundingBox[3] - selectedBoundingBox[1],
                    )}
                  </td>
                </tr>
              </>
            )}
            {selectedElements.length === 1 && (
              <tr>
                <td>{t("stats.angle")}</td>
                <td>
                  {`${Math.round(
                    (selectedElements[0].angle * 180) / Math.PI,
                  )}°`}
                </td>
              </tr>
            )}
            {objectiveStats()}
            {props.renderCustomStats?.(props.elements, props.appState)}
          </tbody>
        </table>
      </Island>
    </div>
  );
};
