import * as React from "react";

export interface BookSpineProps {
  title: string;
  author?: string;
  color: string;
  width?: number | string;
  height?: number | string;
  onClick?: () => void;
  isSelected?: boolean;
}

export function BookSpine(props: BookSpineProps): React.ReactElement;
export default BookSpine;
