import { Button } from "../ui/Button";

interface StateBlockBaseProps {
  title: string;
  description: string;
  tone?: "neutral" | "warning" | "danger";
}

type StateBlockActionProps =
  | {
      actionLabel: string;
      onAction: () => void;
    }
  | {
      actionLabel?: never;
      onAction?: never;
    };

type StateBlockProps = StateBlockBaseProps & StateBlockActionProps;

export function StateBlock({ title, description, actionLabel, onAction, tone = "neutral" }: StateBlockProps) {
  return (
    <div className={`state-block state-block--${tone}`}>
      <div className="state-block__title">{title}</div>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" variant={tone === "danger" ? "danger" : "secondary"} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
