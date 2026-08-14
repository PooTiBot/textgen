type Props = {
  kicker: string;
  title: string;
};

export default function SettingsSectionTitle({ kicker, title }: Props) {
  return (
    <div className="panel-controls-title-row">
      <div>
        <span className="panel-controls-kicker">{kicker}</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
