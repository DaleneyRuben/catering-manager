interface Props {
  clientName: string;
  planName: string;
  duration: number;
  onClose: () => void;
  onAssign: (startDate: string) => Promise<void>;
}

export function AssignStartDateModal(_props: Props) {
  return null;
}
