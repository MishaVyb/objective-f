import React from "react";
import { MainMenu } from "../../packages/excalidraw/index";
import { LanguageList } from "./LanguageList";
import { ObjectiveMainMenu } from "../../objective-app/objective/components/AppMainMenuItems";
import { CONTACT_AUTHOR_LINK } from "../../objective-app/objective-plus/constants";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

export const AppMainMenu: React.FC<{
  onCollabDialogOpen: () => any;
  isCollaborating: boolean;
  isCollabEnabled: boolean;
}> = React.memo((props) => {
  return (
    <MainMenu>
      {/* <MainMenu.DefaultItems.LoadScene /> */}
      <ObjectiveMainMenu.NewScene />
      <ObjectiveMainMenu.RenameScene />
      <MainMenu.DefaultItems.SaveToActiveFile />
      {/* <MainMenu.DefaultItems.Export /> */}
      <ObjectiveMainMenu.SaveScene />
      <MainMenu.DefaultItems.SaveAsImage />
      <ObjectiveMainMenu.ShareOption />
      {/* {props.isCollabEnabled && (
        <MainMenu.DefaultItems.LiveCollaborationTrigger
          isCollaborating={props.isCollaborating}
          onSelect={() => props.onCollabDialogOpen()}
        />
      )} */}

      <MainMenu.DefaultItems.ClearCanvas />
      <MainMenu.Separator />
      <MainMenu.DefaultItems.Help />
      <MainMenu.ItemLink
        icon={<PaperPlaneIcon />}
        href={CONTACT_AUTHOR_LINK}
        target="_blank"
      >
        {"Contact Us"}
      </MainMenu.ItemLink>
      {/* <MainMenu.ItemLink
        icon={PlusPromoIcon}
        href={`${
          import.meta.env.VITE_APP_PLUS_LP
        }/plus?utm_source=excalidraw&utm_medium=app&utm_content=hamburger`}
        className="ExcalidrawPlus"
      >
        Excalidraw+
      </MainMenu.ItemLink>
      <MainMenu.DefaultItems.Socials />
      <MainMenu.Separator />
      <MainMenu.DefaultItems.ToggleTheme />
      */}
      <MainMenu.Separator />
      {/* <MainMenu.ItemCustom>
        <LanguageList style={{ width: "100%" }} />
      </MainMenu.ItemCustom> */}
      <MainMenu.DefaultItems.ChangeCanvasBackground />
    </MainMenu>
  );
});
