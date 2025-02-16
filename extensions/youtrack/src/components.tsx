import { useEffect, useState } from "react";
import { Action, ActionPanel, List, Icon, Color, Image, Detail } from "@raycast/api";
import { Issue, IssueExtended } from "./interfaces";
import { issueStates } from "./utils";

const resolvedIcon = { source: Icon.Check, tintColor: Color.Green };
const openIcon = { source: Icon.Dot };

export function IssueListItem(props: {
  item: Issue;
  index: number;
  instance: string;
  resolved: boolean;
  getIssueDetailsCb: () => Promise<IssueExtended> | null;
}) {
  const [state, setState] = useState<{ icon: Image; accessories: List.Item.Accessory[] }>({
    icon: { source: "" },
    accessories: [],
  });

  useEffect(() => {
    const icon = props.resolved ? resolvedIcon : openIcon;
    const tooltip = props.resolved ? issueStates.ISSUE_RESOLVED : issueStates.ISSUE_OPEN;
    const accessories = [{ text: props.item.id, tooltip }];
    setState({ icon, accessories });
  }, [props.item.id, props.resolved]);

  return (
    <List.Item
      icon={state.icon}
      title={props.item.summary}
      subtitle={props.item.date}
      accessories={state.accessories}
      actions={<Actions item={props.item} instance={props.instance} getIssueDetailsCb={props.getIssueDetailsCb} />}
    />
  );
}

function IssueDetails(props: {
  getIssueDetailsCb: () => Promise<IssueExtended> | null;
  link: string;
  instance: string;
}) {
  const [issue, setIssue] = useState<IssueExtended | null>(null);
  useEffect(() => {
    async function fetchIssueDetails() {
      const issue = await props.getIssueDetailsCb();
      setIssue(issue);
    }
    fetchIssueDetails();
  }, []);

  if (!issue) {
    return <Detail isLoading />;
  }

  const issueBody = `## ${issue.summary}\n\n${issue.description ?? ""}`;
  return (
    <Detail
      markdown={issueBody}
      navigationTitle={`${issue.id}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Created" text={issue.created} />
          <Detail.Metadata.Label
            title="Author"
            text={issue.reporter?.fullName}
            icon={`${props.instance}${issue.reporter?.avatarUrl}`}
          />
          <Detail.Metadata.Label title="Updated" text={issue.date} />
          <Detail.Metadata.Label
            title="Updater"
            text={issue.updater?.fullName}
            icon={`${props.instance}${issue.reporter?.avatarUrl}`}
          />
          {issue.tags?.length && (
            <Detail.Metadata.TagList title="Tags">
              {issue.tags.map((tag) => (
                <Detail.Metadata.TagList.Item key={tag.id} text={tag.name} />
              ))}
            </Detail.Metadata.TagList>
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel title={issue.id}>
          <ActionPanel.Section>
            <Action.OpenInBrowser url={props.link} />
            <Action.CopyToClipboard content={issue.id} title="Copy ID" />
            <Action.CopyToClipboard
              content={props.link}
              title="Copy Link"
              shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function Actions(props: { item: Issue; instance: string; getIssueDetailsCb: () => Promise<IssueExtended> | null }) {
  const link = `${props.instance}/issue/${props.item.id}`;
  return (
    <ActionPanel title={props.item.summary}>
      <ActionPanel.Section>
        {link && (
          <Action.Push
            icon={Icon.AppWindowSidebarRight}
            title="Show details"
            target={
              <IssueDetails link={link} instance={props.instance} getIssueDetailsCb={() => props.getIssueDetailsCb()} />
            }
          />
        )}
        {link && <Action.CopyToClipboard content={props.item.id} title="Copy ID" />}
        {link && (
          <Action.CopyToClipboard
            content={link}
            title="Copy Link"
            shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
          />
        )}
        {link && <Action.OpenInBrowser url={link} shortcut={{ modifiers: ["opt"], key: "enter" }} />}
      </ActionPanel.Section>
    </ActionPanel>
  );
}
