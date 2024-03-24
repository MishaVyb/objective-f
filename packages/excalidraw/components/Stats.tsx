import React from "react";
import { getCommonBounds, getElementAbsoluteCoords } from "../element/bounds";
import { NonDeletedExcalidrawElement } from "../element/types";
import { t } from "../i18n";
import { getTargetElements } from "../scene";
import { ExcalidrawProps, UIAppState } from "../types";
import { CloseIcon } from "./icons";
import { Island } from "./Island";
import "./Stats.scss";
import { isLinearElement } from "../element/typeChecks";
import { LinearElementEditor } from "../element/linearElementEditor";
import {
  getAngDeg,
  getBasisPoints,
  getLineFunc,
  getRectangleCoordinates,
} from "../../../objective-app/objective/elements/math";
import { Code, Flex, Separator, Tabs, Text } from "@radix-ui/themes";
import {
  getObjectiveBasis,
  getObjectiveSingleMeta,
} from "../../../objective-app/objective/meta/selectors";
import { BasisElementType } from "../../../objective-app/objective/elements/snapElements";
import { isCameraMeta } from "../../../objective-app/objective/meta/types";
import { objectEntries } from "../../../objective-app/objective/utils/types";

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

  const singleMeta = getObjectiveSingleMeta(selectedElements);
  const selectedElement = selectedElements[0];
  const coordSimple =
    selectedElement && getElementAbsoluteCoords(selectedElement);
  const coordSmart =
    selectedElement &&
    selectedElement.type === "rectangle" &&
    getRectangleCoordinates(selectedElement);

  const basis =
    selectedElement &&
    getObjectiveBasis<BasisElementType>(
      getObjectiveSingleMeta([selectedElement]),
    );
  const basisPoints = basis && getBasisPoints(basis);

  const objectiveMetaInfo = () =>
    singleMeta && (
      <div>
        <div>
          {objectEntries(singleMeta).map(([k, v]) =>
            typeof v === "object" && "length" in v ? (
              <Flex justify={"between"} key={k}>
                <Text>{k}</Text>
                <Code>{`len ${v.length}`}</Code>
              </Flex>
            ) : (
              <Flex justify={"between"} key={k}>
                <Text>{k}</Text>
                <Code>{String(v).slice(0, 50)}</Code>
              </Flex>
            ),
          )}
          {basis && basis.boundElements?.length && (
            <>
              <div>
                <Text>{"Basis Bound Elements"}</Text>
              </div>
              <div>
                <Flex direction={"column"} gap={"1"}>
                  {basis.boundElements.map((el) => (
                    <Code key={el.id}>{el.id}</Code>
                  ))}
                </Flex>
              </div>
            </>
          )}
        </div>
      </div>
    );

  const singleElementInfo =
    selectedElements.length === 1 ? (
      <>
        <tr>
          <th colSpan={2}>{"Single Element Info"}</th>
        </tr>

        <tr>
          <td>{"x y"}</td>
          <td>
            <Code>{Math.round(selectedElements[0].x)}</Code>
          </td>
          <td>
            <Code>{Math.round(selectedElements[0].y)}</Code>
          </td>
        </tr>
        <tr>
          <td>{"w h"}</td>
          <td>
            <Code>{Math.round(selectedElements[0].width)}</Code>
          </td>
          <td>
            <Code>{Math.round(selectedElements[0].height)}</Code>
          </td>
        </tr>
        <tr>
          <td>{"coord (simple)"}</td>
          <td>
            {" "}
            <Code>{Math.round(coordSimple[0])}</Code>{" "}
            <Code>{Math.round(coordSimple[1])}</Code>
            {" | "}
            <Code>{Math.round(coordSimple[2])}</Code>{" "}
            <Code>{Math.round(coordSimple[3])}</Code>
            {" | center "}
            <Code>{Math.round(coordSimple[4])}</Code>{" "}
            <Code>{Math.round(coordSimple[5])}</Code>
          </td>
        </tr>
        {coordSmart && (
          <tr>
            <td>{"coord (smart)"}</td>
            <td>
              {" "}
              <Code>
                <Code>{Math.round(coordSmart[0].x)}</Code>
              </Code>{" "}
              <Code>{Math.round(coordSmart[0].y)}</Code>
              {" | "}
              <Code>{Math.round(coordSmart[1].x)}</Code>{" "}
              <Code>{Math.round(coordSmart[1].y)}</Code>
            </td>
          </tr>
        )}
        {basisPoints && (
          <tr>
            <td>{"basis points"}</td>
            <td>
              {" "}
              <Code>
                <Code>{Math.round(basisPoints[0].x)}</Code>
              </Code>{" "}
              <Code>{Math.round(basisPoints[0].y)}</Code>
              {" | "}
              <Code>{Math.round(basisPoints[1].x)}</Code>{" "}
              <Code>{Math.round(basisPoints[1].y)}</Code>
            </td>
          </tr>
        )}
      </>
    ) : null;
  const linerElementInfo =
    selectedElements.length === 1 && isLinearElement(selectedElement) ? (
      <>
        <tr>
          <th colSpan={2}>{"Liner Element Info"}</th>
        </tr>
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
                <Code>{Math.round(absStart[0])}</Code>{" "}
                <Code>{Math.round(absStart[1])}</Code>
                {" | end "}
                <Code>{Math.round(absEnd[0])}</Code>{" "}
                <Code>{Math.round(absEnd[1])}</Code>
                {" | angle "}
                <Code>{Math.round(ang)}</Code>
                {/* {funcStr} */}
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
                <Code>{Math.round(prevPoint[0])}</Code>{" "}
                <Code>{Math.round(prevPoint[1])}</Code>
                {" | end "}
                <Code>{Math.round(currentPoint[0])}</Code>{" "}
                <Code>{Math.round(currentPoint[1])}</Code>
                {" | angle "}
                <Code>{Math.round(ang)}</Code>
              </td>
            </tr>
          );
        })}
      </>
    ) : null;

  const defaultStats = () => (
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
          <td>
            <Code>
              {Math.round(boundingBox[2]) - Math.round(boundingBox[0])}
            </Code>
          </td>
        </tr>
        <tr>
          <td>{t("stats.height")}</td>
          <td>
            <Code>
              {Math.round(boundingBox[3]) - Math.round(boundingBox[1])}
            </Code>
          </td>
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
              <td>{"x (bounding)"}</td>
              <td>
                <Code>{Math.round(selectedBoundingBox[0])}</Code>
              </td>
            </tr>
            <tr>
              <td>{"y (bounding)"}</td>
              <td>
                <Code>{Math.round(selectedBoundingBox[1])}</Code>
              </td>
            </tr>
            <tr>
              <td>{"w (bounding)"}</td>
              <td>
                <Code>
                  {Math.round(selectedBoundingBox[2] - selectedBoundingBox[0])}
                </Code>
              </td>
            </tr>
            <tr>
              <td>{"h (bounding)"}</td>
              <td>
                <Code>
                  {Math.round(selectedBoundingBox[3] - selectedBoundingBox[1])}
                </Code>
              </td>
            </tr>
          </>
        )}

        {singleElementInfo}
        {linerElementInfo}

        {selectedElements.length === 1 && (
          <tr>
            <td>{t("stats.angle")}</td>
            <td>
              <Code>
                {`${Math.round((selectedElements[0].angle * 180) / Math.PI)}°`}
              </Code>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const envObjectiveInfo = () =>
    objectEntries(import.meta.env).map(
      ([k, v]) =>
        k.toString().match(/.*OBJECTIVE.*/) && (
          <Flex justify={"between"} key={k}>
            <Text>{k}</Text>
            <Code>{String(v).slice(0, 50)} </Code>
          </Flex>
        ),
    );

  const envExcalidrawInfo = () =>
    objectEntries(import.meta.env).map(
      ([k, v]) =>
        !k.toString().match(/.*OBJECTIVE.*/) && (
          <Flex justify={"between"} key={k}>
            <Text>{k}</Text>
            <Code>{String(v).slice(0, 50)} </Code>
          </Flex>
        ),
    );

  const fullElementsInfo = () => (
    <div>
      <div>
        {selectedElements.map((el) => (
          <div key={el.id}>
            {objectEntries(el).map(
              ([k, v]) =>
                !k.toString().match(/.*OBJECTIVE.*/) && (
                  <Flex justify={"between"} key={k}>
                    <Text>{k}</Text>
                    <Code>{String(v).slice(0, 50)} </Code>
                  </Flex>
                ),
            )}
            <Separator size={"4"} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="Stats">
      <Island padding={2}>
        <div className="close" onClick={props.onClose}>
          {CloseIcon}
        </div>
        <h3>{t("stats.title")}</h3>
        <Tabs.Root
          defaultValue="meta"
          style={{
            overflowY: "scroll",
            maxHeight: 400,
          }}
        >
          <Tabs.List size={"1"}>
            <Tabs.Trigger value="meta">Meta</Tabs.Trigger>
            <Tabs.Trigger value="default">XY</Tabs.Trigger>
            <Tabs.Trigger value="fullElementsInfo">Els</Tabs.Trigger>
            <Tabs.Trigger value="custom">Sys</Tabs.Trigger>
            <Tabs.Trigger value="envObjective">Env Obj</Tabs.Trigger>
            <Tabs.Trigger value="envExcalidraw">Env Exc</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="meta">{objectiveMetaInfo()}</Tabs.Content>

          <Tabs.Content value="default">{defaultStats()}</Tabs.Content>
          <Tabs.Content value="fullElementsInfo">
            {fullElementsInfo()}
          </Tabs.Content>

          <Tabs.Content value="custom">
            {props.renderCustomStats?.(props.elements, props.appState)}
          </Tabs.Content>

          <Tabs.Content value="envObjective">{envObjectiveInfo()}</Tabs.Content>
          <Tabs.Content value="envExcalidraw">
            {envExcalidrawInfo()}
          </Tabs.Content>
        </Tabs.Root>
      </Island>
    </div>
  );
};
